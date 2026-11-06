'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sanity } from '@/lib/sanity';
import {
  verifyGoogleCredential, signSession, setSessionCookie, clearSessionCookie, requireSession, getSession,
} from '@/lib/session';
import { cleanPalette } from '@/lib/color';
import { hasContentCredentials, sniffImageType } from '@/lib/c2pa';
import { text, httpUrl, docId, category, reportReason } from '@/lib/validate';

export type FormState = { error?: string; ok?: string } | null;

const key = () => randomUUID().replace(/-/g, '').slice(0, 12);

// ---------- Sign in / out ----------

export async function signIn(credential: string): Promise<{ error?: string }> {
  if (typeof credential !== 'string' || credential.length > 4096) return { error: 'Sign in failed.' };
  let user;
  try {
    user = await verifyGoogleCredential(credential);
  } catch {
    return { error: 'Google could not confirm that sign in. Try again.' };
  }
  await sanity().createIfNotExists({ _id: user.sub, _type: 'user', userName: user.name, image: user.picture });
  await setSessionCookie(await signSession(user));
  return {};
}

export async function signOut() {
  await clearSessionCookie();
  redirect('/login');
}

// ---------- Sharing a piece ----------

const MAX_MAIN = 12 * 1024 * 1024;
const MAX_STEP = 4 * 1024 * 1024;
const MAX_STEPS = 6;

async function readImage(file: File, max: number) {
  if (file.size === 0) return null;
  if (file.size > max) throw new Error(`${file.name} is over ${Math.round(max / 1024 / 1024)} MB.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) throw new Error(`${file.name} is not a JPG, PNG, WebP or GIF.`);
  return { bytes, type, name: file.name.slice(0, 120) };
}

export async function sharePiece(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Your session ended. Sign in again.' };

  const title = text(form.get('title'), 120);
  const about = text(form.get('about'), 1500);
  const medium = text(form.get('medium'), 200);
  const ai = text(form.get('ai'), 20);
  const own = text(form.get('own'), 10);
  const cat = category(form.get('category'));
  const destination = httpUrl(form.get('destination'));
  const sourceUrl = httpUrl(form.get('sourceUrl'));
  const sourceName = text(form.get('sourceName'), 120);
  const commissions = form.get('commissions') === 'yes';
  let palette: string[] = [];
  try {
    palette = cleanPalette(JSON.parse(text(form.get('palette'), 400) || '[]'));
  } catch {
    palette = [];
  }

  if (!title) return { error: 'Give the piece a title.' };
  if (!cat) return { error: 'Pick a category.' };
  if (ai === 'mostly') return { error: 'Exedia only hosts work made by people. Mostly generated images cannot be posted.' };
  if (ai !== 'none' && ai !== 'assisted') return { error: 'Tell us whether AI tools were used.' };
  if (own !== 'me' && own !== 'other') return { error: 'Say who made it.' };
  if (own === 'other' && (!sourceUrl || !sourceName)) {
    return { error: 'For work by someone else, add their name and a link to the original.' };
  }

  const main = form.get('image');
  if (!(main instanceof File) || main.size === 0) return { error: 'Add an image of the finished piece.' };
  const steps = form.getAll('process').filter((f): f is File => f instanceof File && f.size > 0);
  if (steps.length > MAX_STEPS) return { error: `Up to ${MAX_STEPS} process shots.` };

  let image, stepImages;
  try {
    image = await readImage(main, MAX_MAIN);
    stepImages = await Promise.all(steps.map((f) => readImage(f, MAX_STEP)));
  } catch (err) {
    return { error: (err as Error).message };
  }
  if (!image) return { error: 'Add an image of the finished piece.' };

  const client = sanity();
  const upload = (img: { bytes: Uint8Array; type: string; name: string }) =>
    client.assets.upload('image', Buffer.from(img.bytes), { contentType: img.type, filename: img.name });

  const asset = await upload(image);
  const stepAssets = await Promise.all(stepImages.filter((s) => s !== null).map(upload));

  const id = `pin-${randomUUID()}`;
  await client.create({
    _id: id,
    _type: 'pin',
    title,
    about,
    medium,
    category: cat,
    destination: destination ?? undefined,
    ai,
    hasCredentials: hasContentCredentials(image.bytes),
    palette: palette.length ? palette : undefined,
    sourceUrl: own === 'other' ? sourceUrl : undefined,
    sourceName: own === 'other' ? sourceName : undefined,
    credits:
      own === 'other'
        ? [{ _key: key(), role: 'Made by', name: sourceName, url: sourceUrl }]
        : [{ _key: key(), role: 'Made by', name: session.name }],
    image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    processShots: stepAssets.map((a) => ({ _key: key(), _type: 'image', asset: { _type: 'reference', _ref: a._id } })),
    userId: session.sub,
    postedBy: { _type: 'postedBy', _ref: session.sub },
    save: [],
    comments: [],
  });

  if (commissions) await client.patch(session.sub).set({ commissions: true }).commit();

  revalidatePath('/');
  redirect(`/piece/${id}`);
}

// ---------- Owner and admin checks ----------

async function pieceOwner(id: string) {
  return sanity().fetch<{ owner?: string } | null>(`*[_type == "pin" && _id == $id][0]{ "owner": postedBy._ref }`, { id });
}

export async function deletePiece(form: FormData) {
  const session = await requireSession();
  const id = docId(form.get('id'));
  if (!id) return;
  const pin = await pieceOwner(id);
  if (!pin) return;
  // The old app let anyone delete anything. Only the maker or an admin can now.
  if (pin.owner !== session.sub && !session.isAdmin) throw new Error('Only the maker can delete this.');
  await sanity().delete(id);
  revalidatePath('/');
  redirect('/');
}

// ---------- Saves, comments, follows ----------

export async function toggleSave(form: FormData) {
  const session = await requireSession();
  const id = docId(form.get('id'));
  if (!id) return;
  const client = sanity();
  const saved = await client.fetch<boolean>(
    `count(*[_type == "pin" && _id == $id && $me in save[].userId]) > 0`,
    { id, me: session.sub },
  );
  if (saved) {
    await client.patch(id).unset([`save[userId==${JSON.stringify(session.sub)}]`]).commit();
  } else {
    await client
      .patch(id)
      .setIfMissing({ save: [] })
      .append('save', [{ _key: key(), userId: session.sub, postedBy: { _type: 'postedBy', _ref: session.sub } }])
      .commit();
  }
  revalidatePath(`/piece/${id}`);
}

export async function addComment(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in again to comment.' };
  const id = docId(form.get('id'));
  const comment = text(form.get('comment'), 1000);
  if (!id || !comment) return { error: 'Write something first.' };
  await sanity()
    .patch(id)
    .setIfMissing({ comments: [] })
    .append('comments', [{ _key: key(), comment, postedBy: { _type: 'postedBy', _ref: session.sub } }])
    .commit();
  revalidatePath(`/piece/${id}`);
  return { ok: 'Posted.' };
}

export async function deleteComment(form: FormData) {
  const session = await requireSession();
  const id = docId(form.get('id'));
  const commentKey = docId(form.get('key'));
  if (!id || !commentKey) return;
  const owner = await sanity().fetch<string | null>(
    `*[_type == "pin" && _id == $id][0].comments[_key == $key][0].postedBy._ref`,
    { id, key: commentKey },
  );
  if (owner !== session.sub && !session.isAdmin) return;
  await sanity().patch(id).unset([`comments[_key==${JSON.stringify(commentKey)}]`]).commit();
  revalidatePath(`/piece/${id}`);
}

export async function toggleFollow(form: FormData) {
  const session = await requireSession();
  const maker = docId(form.get('maker'));
  if (!maker || maker === session.sub) return;
  const client = sanity();
  const following = await client.fetch<boolean>(
    `count(*[_type == "user" && _id == $me && $maker in following[]._ref]) > 0`,
    { me: session.sub, maker },
  );
  if (following) {
    await client.patch(session.sub).unset([`following[_ref==${JSON.stringify(maker)}]`]).commit();
  } else {
    await client
      .patch(session.sub)
      .setIfMissing({ following: [] })
      .append('following', [{ _key: key(), _type: 'reference', _ref: maker, _weak: true }])
      .commit();
  }
  revalidatePath(`/maker/${maker}`);
  revalidatePath('/');
}

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in again.' };
  const bio = text(form.get('bio'), 300);
  const contactRaw = text(form.get('contactUrl'), 300);
  const contactUrl = contactRaw.startsWith('mailto:') ? contactRaw : httpUrl(contactRaw);
  if (contactRaw && !contactUrl) return { error: 'The contact link should start with https:// or mailto:' };
  await sanity()
    .patch(session.sub)
    .set({ bio, commissions: form.get('commissions') === 'yes', contactUrl: contactUrl ?? '' })
    .commit();
  revalidatePath(`/maker/${session.sub}`);
  return { ok: 'Saved.' };
}

// ---------- Trails ----------

async function canEditTrail(trailId: string, userId: string) {
  return sanity().fetch<boolean>(
    `count(*[_type == "trail" && _id == $id && (owner._ref == $me || $me in collaborators[]._ref)]) > 0`,
    { id: trailId, me: userId },
  );
}

export async function createTrail(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in again.' };
  const title = text(form.get('title'), 80);
  const about = text(form.get('about'), 500);
  if (!title) return { error: 'Name the trail.' };
  const id = `trail-${randomUUID()}`;
  const first = docId(form.get('pieceId'));
  await sanity().create({
    _id: id,
    _type: 'trail',
    title,
    about,
    owner: { _type: 'reference', _ref: session.sub },
    collaborators: [],
    items: first ? [{ _key: key(), note: '', piece: { _type: 'reference', _ref: first, _weak: true } }] : [],
  });
  redirect(`/trails/${id}`);
}

export async function addToTrail(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in again.' };
  const trailId = docId(form.get('trailId'));
  const pieceId = docId(form.get('pieceId'));
  const note = text(form.get('note'), 500);
  if (!trailId || !pieceId) return { error: 'Pick a trail.' };
  if (!(await canEditTrail(trailId, session.sub))) return { error: 'You can only add to your own trails.' };
  await sanity()
    .patch(trailId)
    .setIfMissing({ items: [] })
    .append('items', [{ _key: key(), note, piece: { _type: 'reference', _ref: pieceId, _weak: true } }])
    .commit();
  revalidatePath(`/trails/${trailId}`);
  return { ok: 'Added to the trail.' };
}

export async function editStop(form: FormData) {
  const session = await requireSession();
  const trailId = docId(form.get('trailId'));
  const stopKey = docId(form.get('key'));
  const op = text(form.get('op'), 10);
  if (!trailId || !stopKey) return;
  if (!(await canEditTrail(trailId, session.sub))) return;
  const client = sanity();
  const path = `items[_key==${JSON.stringify(stopKey)}]`;

  if (op === 'remove') {
    await client.patch(trailId).unset([path]).commit();
  } else if (op === 'note') {
    await client.patch(trailId).set({ [`${path}.note`]: text(form.get('note'), 500) }).commit();
  } else if (op === 'up' || op === 'down') {
    const items = await client.fetch<{ _key: string }[] | null>(`*[_id == $id][0].items`, { id: trailId });
    if (!items) return;
    const i = items.findIndex((s) => s._key === stopKey);
    const j = op === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    await client.patch(trailId).set({ items }).commit();
  }
  revalidatePath(`/trails/${trailId}`);
}

export async function addCollaborator(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in again.' };
  const trailId = docId(form.get('trailId'));
  // Accept a maker profile link or a bare id.
  const raw = text(form.get('maker'), 300);
  const makerId = docId(raw.split('/maker/').pop()?.split(/[?#/]/)[0]);
  if (!trailId || !makerId) return { error: 'Paste a link to their Exedia profile.' };
  const owner = await sanity().fetch<string | null>(`*[_type == "trail" && _id == $id][0].owner._ref`, { id: trailId });
  if (owner !== session.sub) return { error: 'Only the trail owner can add people.' };
  const exists = await sanity().fetch<boolean>(`count(*[_type == "user" && _id == $id]) > 0`, { id: makerId });
  if (!exists) return { error: 'No one with that profile.' };
  await sanity()
    .patch(trailId)
    .setIfMissing({ collaborators: [] })
    .unset([`collaborators[_ref==${JSON.stringify(makerId)}]`])
    .append('collaborators', [{ _key: key(), _type: 'reference', _ref: makerId }])
    .commit();
  revalidatePath(`/trails/${trailId}`);
  return { ok: 'Added.' };
}

export async function deleteTrail(form: FormData) {
  const session = await requireSession();
  const trailId = docId(form.get('trailId'));
  if (!trailId) return;
  const owner = await sanity().fetch<string | null>(`*[_type == "trail" && _id == $id][0].owner._ref`, { id: trailId });
  if (owner !== session.sub) return;
  await sanity().delete(trailId);
  redirect('/trails');
}

// ---------- Reports and the review queue ----------

export async function reportPiece(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: 'Sign in again.' };
  const id = docId(form.get('id'));
  const reason = reportReason(form.get('reason'));
  if (!id || !reason) return { error: 'Pick a reason.' };
  const already = await sanity().fetch<boolean>(
    `count(*[_type == "report" && piece._ref == $id && reporter._ref == $me && status == "open"]) > 0`,
    { id, me: session.sub },
  );
  if (already) return { ok: 'You already reported this. Someone will look at it.' };
  await sanity().create({
    _type: 'report',
    reason,
    details: text(form.get('details'), 1000),
    status: 'open',
    piece: { _type: 'reference', _ref: id, _weak: true },
    reporter: { _type: 'reference', _ref: session.sub, _weak: true },
  });
  return { ok: 'Thanks. A person will review it. Nothing changes on the piece until then.' };
}

async function requireAdmin() {
  const session = await requireSession();
  if (!session.isAdmin) throw new Error('Admins only.');
  return session;
}

export async function resolveReport(form: FormData) {
  await requireAdmin();
  const id = docId(form.get('id'));
  const decision = text(form.get('decision'), 10);
  if (!id || (decision !== 'kept' && decision !== 'hidden')) return;
  const client = sanity();
  const pieceId = await client.fetch<string | null>(`*[_type == "report" && _id == $id][0].piece._ref`, { id });
  const tx = client.transaction().patch(id, (p) => p.set({ status: decision }));
  if (decision === 'hidden' && pieceId) tx.patch(pieceId, (p) => p.set({ hidden: true }));
  await tx.commit();
  revalidatePath('/review');
}

export async function setFeatured(form: FormData) {
  await requireAdmin();
  const id = docId(form.get('id'));
  if (!id) return;
  const on = form.get('on') === 'yes';
  await sanity()
    .patch(id)
    .set(on ? { featured: true, featuredAt: new Date().toISOString() } : { featured: false })
    .commit();
  revalidatePath('/');
  revalidatePath('/review');
}
