import Link from 'next/link';
import { notFound } from 'next/navigation';
import Avatar from '@/components/Avatar';
import Tile from '@/components/Tile';
import { ProfileForm, Submit } from '@/components/Forms';
import { getSession } from '@/lib/session';
import { getPerson, getMakerWork, getSavedBy, getFollowing } from '@/lib/queries';
import { toggleFollow } from '@/app/actions';
import { docId } from '@/lib/validate';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = docId((await params).id);
  const person = id ? await getPerson(id) : null;
  return { title: person?.userName ?? 'Maker' };
}

export default async function MakerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const id = docId((await params).id);
  if (!id) notFound();
  const tab = (await searchParams).tab === 'saved' ? 'saved' : 'made';
  const session = (await getSession())!;
  const person = await getPerson(id);
  if (!person) notFound();

  const isMe = session.sub === id;
  const [work, following] = await Promise.all([
    tab === 'saved' ? getSavedBy(id) : getMakerWork(id),
    getFollowing(session.sub),
  ]);
  const followsThem = following.includes(id);

  return (
    <>
      <div className="maker-head">
        <Avatar person={person} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="row">
            <h1>{person.userName}</h1>
            {person.commissions && <span className="open-badge">Open for commissions</span>}
          </div>
          {person.bio && <p>{person.bio}</p>}
          <p className="mono">{person.followers} follower{person.followers === 1 ? '' : 's'}, following {person.following?.length ?? 0}</p>
        </div>
        <div className="row">
          {person.commissions && person.contactUrl && !isMe && (
            <a className="btn" href={person.contactUrl} target="_blank" rel="noopener noreferrer nofollow">Get in touch</a>
          )}
          {!isMe && (
            <form action={toggleFollow}>
              <input type="hidden" name="maker" value={id} />
              <Submit className={followsThem ? 'btn' : 'btn ink'}>{followsThem ? 'Following' : 'Follow'}</Submit>
            </form>
          )}
        </div>
      </div>

      {isMe && (
        <details className="panel" style={{ marginBottom: 20, maxWidth: 560, background: 'var(--surface)' }}>
          <summary>Edit your profile</summary>
          <ProfileForm bio={person.bio ?? ''} commissions={!!person.commissions} contactUrl={person.contactUrl ?? ''} />
        </details>
      )}

      <div className="controls">
        <nav className="tabs" aria-label="Work">
          <Link href={`/maker/${id}`} aria-current={tab === 'made'}>Shared</Link>
          <Link href={`/maker/${id}?tab=saved`} aria-current={tab === 'saved'}>Saved</Link>
        </nav>
      </div>

      {work.length ? (
        <div className="wall">{work.map((c) => <Tile key={c._id} card={c} />)}</div>
      ) : (
        <div className="empty">
          <h2>{tab === 'saved' ? 'No saves yet' : 'Nothing shared yet'}</h2>
          {isMe && tab === 'made' && <Link className="btn primary" href="/share">Share a piece</Link>}
        </div>
      )}
    </>
  );
}
