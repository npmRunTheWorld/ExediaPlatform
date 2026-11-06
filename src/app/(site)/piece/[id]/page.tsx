import Link from 'next/link';
import { notFound } from 'next/navigation';
import Avatar from '@/components/Avatar';
import Tile from '@/components/Tile';
import ProcessViewer from '@/components/ProcessViewer';
import { CommentForm, ReportForm, AddToTrail, Submit } from '@/components/Forms';
import { getSession } from '@/lib/session';
import { getPiece, getMoreLikeThis, getTrailsFor, getFollowing } from '@/lib/queries';
import { toggleSave, toggleFollow, deletePiece, deleteComment, setFeatured } from '@/app/actions';
import { docId } from '@/lib/validate';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = docId((await params).id);
  const piece = id ? await getPiece(id) : null;
  return { title: piece?.title ?? 'Piece' };
}

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const id = docId((await params).id);
  if (!id) notFound();
  const session = (await getSession())!;
  const piece = await getPiece(id);
  if (!piece) notFound();

  const [more, trails, following] = await Promise.all([
    getMoreLikeThis(piece),
    getTrailsFor(session.sub),
    getFollowing(session.sub),
  ]);

  const maker = piece.maker;
  const isOwner = maker?._id === session.sub;
  const saved = !!piece.savedBy?.some((p) => p?._id === session.sub);
  const followsMaker = !!maker && following.includes(maker._id);
  const savers = (piece.savedBy ?? []).filter(Boolean);

  const steps = piece.processShots ?? [];
  const shots = [
    ...steps.map((s, i) => ({ key: s._key, url: s.url, w: s.w, h: s.h, label: s.caption || `Step ${i + 1}` })),
    { key: 'final', url: piece.imageUrl, w: piece.w, h: piece.h, label: 'Finished' },
  ];

  return (
    <>
      <article className="piece">
        <ProcessViewer title={piece.title ?? 'Untitled'} shots={shots} />

        <div className="info">
          <div style={{ display: 'grid', gap: 10 }}>
            <h1>{piece.title || 'Untitled'}</h1>
            {maker && (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Link className="byline" href={`/maker/${maker._id}`} style={{ textDecoration: 'none' }}>
                  <Avatar person={maker} />
                  <span>{maker.userName}</span>
                </Link>
                {!isOwner && (
                  <form action={toggleFollow}>
                    <input type="hidden" name="maker" value={maker._id} />
                    <Submit className={followsMaker ? 'btn small' : 'btn small ink'}>{followsMaker ? 'Following' : 'Follow'}</Submit>
                  </form>
                )}
              </div>
            )}
            {piece.about && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{piece.about}</p>}
            <div className="row">
              <form action={toggleSave}>
                <input type="hidden" name="id" value={piece._id} />
                <Submit className={saved ? 'btn' : 'btn primary'}>{saved ? 'Saved' : 'Save'}</Submit>
              </form>
              {piece.destination && (
                <a className="btn" href={piece.destination} target="_blank" rel="noopener noreferrer nofollow">Visit link</a>
              )}
              {maker?.commissions && !isOwner && (
                maker.contactUrl
                  ? <a className="btn" href={maker.contactUrl} target="_blank" rel="noopener noreferrer nofollow">Ask about a commission</a>
                  : <Link className="btn" href={`/maker/${maker._id}`}>Open for commissions</Link>
              )}
            </div>
          </div>

          <section className="sect" aria-labelledby="h-proof">
            <h3 id="h-proof">How it was made</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <div className="proof">
                <strong><i style={{ background: steps.length ? 'var(--stamp)' : 'var(--line)' }} />
                  {steps.length ? `Process shown, ${steps.length} step${steps.length === 1 ? '' : 's'}` : 'No process shots'}
                </strong>
                <span className="hint">{steps.length ? 'Use the slider to go from the first pass to the finished piece.' : 'The maker did not add any. That is fine, and it is not a sign of anything.'}</span>
              </div>
              <div className="proof">
                <strong><i style={{ background: piece.hasCredentials ? 'var(--ok)' : 'var(--line)' }} />
                  {piece.hasCredentials ? 'Content Credentials attached' : 'No Content Credentials'}
                </strong>
                <span className="hint">
                  {piece.hasCredentials
                    ? 'The file carries C2PA data from the camera or editing app. We found it but have not checked the signature yet.'
                    : 'Most files do not have them yet. Missing credentials do not mean the work is fake.'}
                </span>
              </div>
              <div className="proof">
                <strong><i style={{ background: piece.ai === 'assisted' ? 'var(--warn)' : piece.ai === 'none' ? 'var(--ok)' : 'var(--line)' }} />
                  {piece.ai === 'assisted' ? 'AI assisted' : piece.ai === 'none' ? 'No AI used' : 'AI use not declared'}
                </strong>
                <span className="hint">
                  {piece.ai === 'assisted'
                    ? 'The maker says a tool helped with parts of this, like cleanup or a background.'
                    : piece.ai === 'none'
                      ? 'Declared by the maker.'
                      : 'Shared before Exedia asked about AI use.'}
                </span>
              </div>
            </div>
          </section>

          <section className="sect" aria-labelledby="h-credit">
            <h3 id="h-credit">Credit</h3>
            <ol className="chain">
              {piece.sourceName ? (
                <li><span className="dot" /><span><b>{piece.sourceName}</b> made it
                  {piece.sourceUrl && <><br /><a href={piece.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">See the original</a></>}
                </span></li>
              ) : null}
              {maker && (
                <li><span className="dot" /><span><Link href={`/maker/${maker._id}`}>{maker.userName}</Link> {piece.sourceName ? 'shared it here' : 'made it'}</span></li>
              )}
              {savers.slice(0, 5).map((p) => (
                <li key={p!._id}><span className="dot" /><span><Link href={`/maker/${p!._id}`}>{p!.userName}</Link> saved it</span></li>
              ))}
              {savers.length > 5 && <li><span className="dot" /><span className="muted">and {savers.length - 5} more</span></li>}
            </ol>
          </section>

          {piece.palette && piece.palette.length > 0 && (
            <section className="sect" aria-labelledby="h-pal">
              <h3 id="h-pal">Palette</h3>
              <div className="pal">
                {piece.palette.filter(Boolean).map((hex) => (
                  <Link key={hex} href={`/?feed=all&color=${encodeURIComponent(hex)}`} style={{ background: hex }} aria-label={`Find work with ${hex}`}>
                    <span>{hex}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="sect" aria-labelledby="h-facts">
            <h3 id="h-facts">Details</h3>
            <dl className="facts">
              {piece.medium && <><dt>Medium</dt><dd>{piece.medium}</dd></>}
              {piece.category && <><dt>Category</dt><dd>{piece.category}</dd></>}
              <dt>Shared</dt><dd>{new Date(piece._createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
              <dt>Saves</dt><dd>{piece.saves}</dd>
            </dl>
          </section>

          <details className="panel">
            <summary>Add to a trail</summary>
            <AddToTrail pieceId={piece._id} trails={trails.map((t) => ({ _id: t._id, title: t.title }))} />
          </details>

          <section className="sect" aria-labelledby="h-comments">
            <h3 id="h-comments">Comments</h3>
            {piece.comments?.length ? (
              <ul className="comments">
                {piece.comments.map((c) => (
                  <li key={c._key}>
                    <Avatar person={c.postedBy} />
                    <div>
                      <b>{c.postedBy?.userName ?? 'Someone'}</b>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{c.comment}</span>
                      {(c.postedBy?._id === session.sub || session.isAdmin) && (
                        <form action={deleteComment}>
                          <input type="hidden" name="id" value={piece._id} />
                          <input type="hidden" name="key" value={c._key} />
                          <button className="linkish" type="submit">Delete</button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="muted" style={{ margin: '0 0 8px' }}>No comments yet.</p>}
            <CommentForm id={piece._id} />
          </section>

          <div className="row" style={{ justifyContent: 'space-between' }}>
            {!isOwner && (
              <details className="panel" style={{ flex: 1 }}>
                <summary>Report this piece</summary>
                <ReportForm id={piece._id} />
              </details>
            )}
            {session.isAdmin && (
              <form action={setFeatured}>
                <input type="hidden" name="id" value={piece._id} />
                <input type="hidden" name="on" value={piece.featured ? 'no' : 'yes'} />
                <Submit className="btn small">{piece.featured ? 'Remove from edit' : "Add to today's edit"}</Submit>
              </form>
            )}
            {(isOwner || session.isAdmin) && (
              <form action={deletePiece}>
                <input type="hidden" name="id" value={piece._id} />
                <Submit className="btn small danger">Delete piece</Submit>
              </form>
            )}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <>
          <h2 className="section-title">More like this</h2>
          <div className="wall">{more.map((c) => <Tile key={c._id} card={c} />)}</div>
        </>
      )}
    </>
  );
}
