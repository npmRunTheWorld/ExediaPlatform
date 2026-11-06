/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { sized } from '@/components/Tile';
import { CollaboratorForm, Submit } from '@/components/Forms';
import { getSession } from '@/lib/session';
import { getTrail, getTrailsFor } from '@/lib/queries';
import { editStop, deleteTrail } from '@/app/actions';
import { docId } from '@/lib/validate';
import TrailList from '../TrailList';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = docId((await params).id);
  const trail = id ? await getTrail(id) : null;
  return { title: trail?.title ?? 'Trail' };
}

export default async function TrailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = docId((await params).id);
  if (!id) notFound();
  const session = (await getSession())!;
  const [trail, mine] = await Promise.all([getTrail(id), getTrailsFor(session.sub)]);
  if (!trail) notFound();

  const isOwner = trail.owner?._id === session.sub;
  const canEdit = isOwner || !!trail.collaborators?.some((c) => c?._id === session.sub);
  const people = [trail.owner, ...(trail.collaborators ?? [])].filter(Boolean);
  const stops = trail.items ?? [];

  return (
    <div className="trails">
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <TrailList trails={mine} current={trail._id} />
        <Link className="btn small" href="/trails" style={{ justifySelf: 'start' }}>New trail</Link>
      </div>

      <div>
        <div className="trail-head">
          <div>
            <h1>{trail.title}</h1>
            {trail.about && <p>{trail.about}</p>}
          </div>
          <div className="stack" aria-label="People on this trail">
            {people.map((p) => <Avatar key={p!._id} person={p} />)}
          </div>
        </div>

        {stops.length === 0 ? (
          <div className="empty">
            <h2>No stops yet</h2>
            <p>Open any piece and use Add to a trail.</p>
            <Link className="btn ink" href="/?feed=all">Browse work</Link>
          </div>
        ) : (
          <ol className="path" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {stops.map((stop, i) => (
              <li className="stop" key={stop._key}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                {stop.piece ? (
                  <Link href={`/piece/${stop.piece._id}`}>
                    <img src={sized(stop.piece.imageUrl, 400)} alt={stop.piece.title ?? ''} loading="lazy" />
                  </Link>
                ) : (
                  <div className="ph" style={{ aspectRatio: '1', borderRadius: 8 }}>Removed</div>
                )}
                <div className="note">
                  <h4>{stop.piece?.title ?? 'This piece was taken down'}</h4>
                  {stop.note ? <p>{stop.note}</p> : canEdit ? <p className="hint">No note yet.</p> : null}
                  {stop.piece?.maker && <p className="who mono">by {stop.piece.sourceName ?? stop.piece.maker.userName}</p>}
                  {canEdit && (
                    <details className="panel" style={{ marginTop: 10 }}>
                      <summary>Edit stop</summary>
                      <form action={editStop} className="stacked" style={{ gap: 8 }}>
                        <input type="hidden" name="trailId" value={trail._id} />
                        <input type="hidden" name="key" value={stop._key} />
                        <input type="hidden" name="op" value="note" />
                        <label><span className="sr">Note</span><textarea name="note" maxLength={500} defaultValue={stop.note ?? ''} /></label>
                        <Submit className="btn small">Save note</Submit>
                      </form>
                      <div className="row" style={{ marginTop: 8 }}>
                        {i > 0 && <StopButton trailId={trail._id} stopKey={stop._key} op="up" label="Move up" />}
                        {i < stops.length - 1 && <StopButton trailId={trail._id} stopKey={stop._key} op="down" label="Move down" />}
                        <StopButton trailId={trail._id} stopKey={stop._key} op="remove" label="Remove" />
                      </div>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {isOwner && (
          <div style={{ display: 'grid', gap: 12, maxWidth: 520, marginTop: 28 }}>
            <details className="panel">
              <summary>Invite someone to this trail</summary>
              <CollaboratorForm trailId={trail._id} />
            </details>
            <form action={deleteTrail}>
              <input type="hidden" name="trailId" value={trail._id} />
              <Submit className="btn small danger">Delete trail</Submit>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function StopButton({ trailId, stopKey, op, label }: { trailId: string; stopKey: string; op: string; label: string }) {
  return (
    <form action={editStop}>
      <input type="hidden" name="trailId" value={trailId} />
      <input type="hidden" name="key" value={stopKey} />
      <input type="hidden" name="op" value={op} />
      <Submit className={op === 'remove' ? 'btn small danger' : 'btn small'}>{label}</Submit>
    </form>
  );
}
