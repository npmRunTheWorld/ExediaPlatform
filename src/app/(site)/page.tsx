import Link from 'next/link';
import Tile from '@/components/Tile';
import { getSession } from '@/lib/session';
import { getFeed, getFollowing, type FeedKind } from '@/lib/queries';
import { SEARCH_SWATCHES, isHex } from '@/lib/color';

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function Discover({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const session = (await getSession())!;
  const following = await getFollowing(session.sub);

  const requested = one(sp.feed);
  const feed: FeedKind =
    requested === 'following' || requested === 'edit' || requested === 'all'
      ? requested
      : following.length ? 'following' : 'all';

  const q = one(sp.q).slice(0, 80);
  const color = isHex(one(sp.color)) ? one(sp.color).toLowerCase() : null;
  const processOnly = one(sp.process) === '1';
  const hideAi = one(sp.noai) === '1';
  const before = one(sp.before) && !Number.isNaN(Date.parse(one(sp.before))) ? one(sp.before) : null;

  const { items, done } = await getFeed(feed, { following, q, color, processOnly, hideAi, before });

  const state = { feed, q, color, process: processOnly ? '1' : '', noai: hideAi ? '1' : '' };
  const href = (over: Partial<Record<keyof typeof state | 'before', string | null>>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...state, ...over })) if (v) next.set(k, v);
    return `/?${next.toString()}`;
  };

  const filtered = !!(q || color || processOnly || hideAi);
  const last = items.at(-1);

  return (
    <>
      <div className="intro">
        <h1>Work made by people, with their names on it.</h1>
        <p>Every piece shows who made it and how. Saves keep the maker&apos;s credit attached, and your Following feed ends when you&apos;ve seen everything new.</p>
      </div>

      <div className="controls">
        <nav className="tabs" aria-label="Feed">
          <Link href={href({ feed: 'following', before: null })} aria-current={feed === 'following'}>Following</Link>
          <Link href={href({ feed: 'edit', before: null })} aria-current={feed === 'edit'}>Today&apos;s edit</Link>
          <Link href={href({ feed: 'all', before: null })} aria-current={feed === 'all'}>Everything</Link>
        </nav>
        <div className="row">
          <Link className="chip" href={href({ process: processOnly ? null : '1', before: null })} aria-current={processOnly}>Process shown</Link>
          <Link className="chip" href={href({ noai: hideAi ? null : '1', before: null })} aria-current={hideAi}>Hide AI assisted</Link>
        </div>
        <div className="swatches" aria-label="Search by color">
          {SEARCH_SWATCHES.map((s) => (
            <Link
              key={s.hex}
              className="sw"
              style={{ background: s.hex }}
              href={href({ color: color === s.hex ? null : s.hex, before: null })}
              aria-current={color === s.hex}
              aria-label={color === s.hex ? `Clear ${s.name} filter` : `Show ${s.name.toLowerCase()} work`}
              title={s.name}
            />
          ))}
          {color && !SEARCH_SWATCHES.some((s) => s.hex === color) && (
            <Link className="sw" style={{ background: color }} href={href({ color: null })} aria-current aria-label="Clear color filter" />
          )}
        </div>
        <span className="status" aria-live="polite">
          {q && <>Results for &ldquo;{q}&rdquo;. </>}
          {items.length} piece{items.length === 1 ? '' : 's'}.
          {filtered && <> <Link href={`/?feed=${feed}`}>Clear filters</Link></>}
        </span>
      </div>

      {items.length === 0 ? (
        <Empty feed={feed} filtered={filtered} following={following.length} />
      ) : (
        <div className="wall">
          {items.map((card) => <Tile key={card._id} card={card} />)}
          {feed === 'following' && done && (
            <div className="caught">
              <h3>You&apos;re caught up</h3>
              <p>That&apos;s everything from the people you follow.</p>
              <Link className="btn" href={href({ feed: 'edit', before: null })}>See today&apos;s edit</Link>
            </div>
          )}
        </div>
      )}

      {!done && last && feed !== 'edit' && (
        <div className="more">
          <Link className="btn" href={href({ before: last._createdAt })}>Older work</Link>
        </div>
      )}
    </>
  );
}

function Empty({ feed, filtered, following }: { feed: FeedKind; filtered: boolean; following: number }) {
  if (filtered) {
    return (
      <div className="empty">
        <h2>Nothing matches yet</h2>
        <p>Try another color or fewer filters.</p>
      </div>
    );
  }
  if (feed === 'following') {
    return (
      <div className="empty">
        <h2>{following ? 'Nothing new from the people you follow' : 'You are not following anyone yet'}</h2>
        <p>Open a piece you like and follow its maker. Their new work shows up here, newest first.</p>
        <Link className="btn ink" href="/?feed=all">Browse everything</Link>
      </div>
    );
  }
  if (feed === 'edit') {
    return (
      <div className="empty">
        <h2>No picks yet today</h2>
        <p>Today&apos;s edit is chosen by a person, not a ranking. Check back later.</p>
      </div>
    );
  }
  return (
    <div className="empty">
      <h2>Nothing here yet</h2>
      <p>Be the first to share something you made.</p>
      <Link className="btn primary" href="/share">Share a piece</Link>
    </div>
  );
}
