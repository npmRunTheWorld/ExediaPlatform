/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Tile, { sized } from '@/components/Tile';
import { Submit } from '@/components/Forms';
import { getSession } from '@/lib/session';
import { getOpenReports, getEditCandidates } from '@/lib/queries';
import { resolveReport, setFeatured } from '@/app/actions';
import { REPORT_REASONS, type ReportReason } from '@/lib/validate';

export const metadata = { title: 'Review' };

export default async function ReviewPage() {
  const session = (await getSession())!;
  // The old admin check ran in the browser. This one runs on the server from the signed session.
  if (!session.isAdmin) notFound();
  const [reports, candidates] = await Promise.all([getOpenReports(), getEditCandidates()]);

  return (
    <>
      <div className="intro">
        <h1>Review queue</h1>
        <p>Reports wait here until a person decides. Keep the piece if the report doesn&apos;t hold up. Hide it if it does. A hidden piece stays in Sanity and can be restored in the Studio.</p>
      </div>

      {reports.length === 0 ? (
        <div className="empty"><h2>No open reports</h2></div>
      ) : (
        <div className="queue">
          {reports.map((r) => (
            <div className="ticket" key={r._id}>
              {r.piece ? (
                <Link href={`/piece/${r.piece._id}`}><img src={sized(r.piece.imageUrl, 300)} alt={r.piece.title ?? ''} /></Link>
              ) : <div className="ph">Piece removed</div>}
              <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
                <b>{REPORT_REASONS[r.reason as ReportReason] ?? r.reason}</b>
                <span className="mono muted">
                  {r.piece?.title ?? 'Untitled'} by {r.piece?.maker?.userName ?? 'unknown'}. Reported by {r.reporter?.userName ?? 'someone'} on {new Date(r._createdAt).toLocaleDateString('en-GB')}
                </span>
                {r.details && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{r.details}</p>}
                <div className="row">
                  <form action={resolveReport}>
                    <input type="hidden" name="id" value={r._id} />
                    <input type="hidden" name="decision" value="kept" />
                    <Submit className="btn small">Keep it up</Submit>
                  </form>
                  <form action={resolveReport}>
                    <input type="hidden" name="id" value={r._id} />
                    <input type="hidden" name="decision" value="hidden" />
                    <Submit className="btn small danger">Hide piece</Submit>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-title">Pick for today&apos;s edit</h2>
      <p className="muted" style={{ marginTop: -6 }}>Recent work that isn&apos;t in the edit yet. Open a piece to add it, or use the button under each one.</p>
      <div className="wall">
        {candidates.map((c) => (
          <div key={c._id} style={{ breakInside: 'avoid' }}>
            <Tile card={c} />
            <form action={setFeatured} style={{ margin: '-8px 0 16px' }}>
              <input type="hidden" name="id" value={c._id} />
              <input type="hidden" name="on" value="yes" />
              <Submit className="btn small">Add to edit</Submit>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
