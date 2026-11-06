import 'server-only';
import { sanity } from './sanity';
import { paletteMatches, isHex, cleanPalette } from './color';
import type { Card, Person, Piece, Report, Trail } from './types';

// Every query takes user input through GROQ parameters ($q, $id, ...), never by
// pasting strings into the query. The old app interpolated search text directly.

const VISIBLE = `_type == "pin" && !(hidden == true)`;

const PERSON = `{ _id, userName, image, bio, commissions, contactUrl }`;

// Old pins have no stored palette. Sanity computes one for every image asset,
// so fall back to that and color search works for the whole archive.
const CARD = `{
  _id, _createdAt, title, category, ai, hasCredentials, featured, sourceName,
  "imageUrl": image.asset->url,
  "w": image.asset->metadata.dimensions.width,
  "h": image.asset->metadata.dimensions.height,
  "lqip": image.asset->metadata.lqip,
  "palette": coalesce(palette, [
    image.asset->metadata.palette.dominant.background,
    image.asset->metadata.palette.vibrant.background,
    image.asset->metadata.palette.muted.background,
    image.asset->metadata.palette.lightVibrant.background,
    image.asset->metadata.palette.darkMuted.background
  ]),
  "processCount": count(coalesce(processShots, [])),
  "saves": count(coalesce(save, [])),
  "maker": postedBy->${PERSON}
}`;

export const PAGE_SIZE = 40;

// Sanity's computed palette can repeat a swatch; keep each color once.
function tidy<T extends { palette?: string[] | null }>(row: T): T {
  return { ...row, palette: cleanPalette(row.palette) };
}
const tidyAll = <T extends { palette?: string[] | null }>(rows: T[]) => rows.map(tidy);

export type FeedKind = 'following' | 'edit' | 'all';

export type Filters = {
  processOnly?: boolean;
  hideAi?: boolean;
  color?: string | null;
  q?: string | null;
  category?: string | null;
};

function filterClause(f: Filters): string {
  const parts: string[] = [];
  if (f.processOnly) parts.push(`count(coalesce(processShots, [])) > 0`);
  if (f.hideAi) parts.push(`!(ai == "assisted")`);
  if (f.q) parts.push(`([title, about, category, medium, sourceName] match $q || postedBy->userName match $q)`);
  if (f.category) parts.push(`category == $category`);
  return parts.length ? ' && ' + parts.join(' && ') : '';
}

function searchTerm(q: string) {
  // GROQ match treats * as a wildcard; strip anything that is not a word char or space.
  const cleaned = q.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim().slice(0, 80);
  return cleaned ? cleaned.split(/\s+/).map((w) => `${w}*`) : null;
}

export async function getFeed(
  kind: FeedKind,
  opts: Filters & { viewerId?: string; following?: string[]; before?: string | null },
): Promise<{ items: Card[]; done: boolean }> {
  const params: Record<string, unknown> = {};
  let scope = VISIBLE;
  let order = '_createdAt desc';

  if (kind === 'following') {
    scope += ` && postedBy._ref in $following`;
    params.following = opts.following ?? [];
  } else if (kind === 'edit') {
    scope += ` && featured == true`;
    order = 'featuredAt desc, _createdAt desc';
  }

  const q = opts.q ? searchTerm(opts.q) : null;
  if (q) params.q = q;
  if (opts.category) params.category = opts.category;
  const filters = { ...opts, q: q ? 'x' : null };

  if (opts.before && kind !== 'edit') {
    scope += ` && _createdAt < $before`;
    params.before = opts.before;
  }

  // Color matching runs here rather than in GROQ, so pull a wider slice and filter.
  const color = opts.color && isHex(opts.color) ? opts.color : null;
  const limit = color ? 400 : PAGE_SIZE + 1;

  const rows = await sanity().fetch<Card[]>(
    `*[${scope}${filterClause(filters)}] | order(${order})[0...${limit}]${CARD}`,
    params,
  );
  const tidied = tidyAll(rows);
  const matched = color ? tidied.filter((r) => paletteMatches(r.palette, color)) : tidied;
  const items = matched.slice(0, PAGE_SIZE);
  return { items, done: matched.length <= PAGE_SIZE };
}

export async function getPiece(id: string): Promise<Piece | null> {
  const piece = await sanity().fetch<Piece | null>(
    `*[${VISIBLE} && _id == $id][0]{
      ...${CARD},
      about, destination, medium, sourceUrl, userId,
      credits[]{ _key, role, name, url },
      "processShots": processShots[]{
        _key, caption,
        "url": asset->url,
        "w": asset->metadata.dimensions.width,
        "h": asset->metadata.dimensions.height
      },
      comments[]{ _key, comment, postedBy->${PERSON} },
      "savedBy": save[].postedBy->${PERSON}
    }`,
    { id },
  );
  return piece ? tidy(piece) : null;
}

export async function getMoreLikeThis(piece: Piece): Promise<Card[]> {
  return sanity().fetch<Card[]>(
    `*[${VISIBLE} && _id != $id && (category == $category || postedBy._ref == $maker)] | order(_createdAt desc)[0...12]${CARD}`,
    { id: piece._id, category: piece.category ?? '', maker: piece.maker?._id ?? '' },
  );
}

export async function getPerson(id: string) {
  return sanity().fetch<(Person & { following?: string[]; followers: number }) | null>(
    `*[_type == "user" && _id == $id][0]{
      ...${PERSON},
      "following": following[]._ref,
      "followers": count(*[_type == "user" && $id in following[]._ref])
    }`,
    { id },
  );
}

export async function getFollowing(viewerId: string): Promise<string[]> {
  const ids = await sanity().fetch<string[] | null>(
    `*[_type == "user" && _id == $id][0].following[]._ref`,
    { id: viewerId },
  );
  return ids ?? [];
}

export async function getMakerWork(id: string): Promise<Card[]> {
  return sanity().fetch<Card[]>(
    `*[${VISIBLE} && postedBy._ref == $id] | order(_createdAt desc)[0...200]${CARD}`,
    { id },
  );
}

export async function getSavedBy(id: string): Promise<Card[]> {
  return sanity().fetch<Card[]>(
    `*[${VISIBLE} && $id in save[].userId] | order(_createdAt desc)[0...200]${CARD}`,
    { id },
  );
}

const TRAIL = `{
  _id, _updatedAt, title, about,
  owner->${PERSON},
  collaborators[]->${PERSON},
  "count": count(coalesce(items, []))
}`;

export async function getTrailsFor(userId: string): Promise<Trail[]> {
  return sanity().fetch<Trail[]>(
    `*[_type == "trail" && (owner._ref == $id || $id in collaborators[]._ref)] | order(_updatedAt desc)${TRAIL}`,
    { id: userId },
  );
}

export async function getTrail(id: string): Promise<Trail | null> {
  return sanity().fetch<Trail | null>(
    `*[_type == "trail" && _id == $id][0]{
      ...${TRAIL},
      items[]{ _key, note, "piece": piece->${CARD} }
    }`,
    { id },
  );
}

export async function getOpenReports(): Promise<Report[]> {
  return sanity().fetch<Report[]>(
    `*[_type == "report" && status == "open"] | order(_createdAt asc)[0...100]{
      _id, _createdAt, reason, details, status,
      "piece": piece->{ ...${CARD}, hidden },
      reporter->${PERSON}
    }`,
  );
}

export async function getEditCandidates(): Promise<Card[]> {
  return sanity().fetch<Card[]>(
    `*[${VISIBLE} && !(featured == true)] | order(_createdAt desc)[0...40]${CARD}`,
  );
}
