import Link from 'next/link';
import type { Trail } from '@/lib/types';

export default function TrailList({ trails, current }: { trails: Trail[]; current?: string }) {
  return (
    <nav className="trail-list" aria-label="Your trails">
      {trails.map((t) => (
        <Link key={t._id} className="trail-pick" href={`/trails/${t._id}`} aria-current={t._id === current ? 'page' : undefined}>
          <b>{t.title}</b>
          <span className="mono muted">{t.count ?? 0} stop{t.count === 1 ? '' : 's'}{t.collaborators?.length ? `, ${t.collaborators.length + 1} people` : ''}</span>
        </Link>
      ))}
      {!trails.length && <p className="muted" style={{ margin: 0 }}>No trails yet.</p>}
    </nav>
  );
}
