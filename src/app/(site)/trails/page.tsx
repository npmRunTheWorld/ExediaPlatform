import { getSession } from '@/lib/session';
import { getTrailsFor } from '@/lib/queries';
import { NewTrailForm } from '@/components/Forms';
import TrailList from './TrailList';

export const metadata = { title: 'Trails' };

export default async function TrailsPage() {
  const session = (await getSession())!;
  const trails = await getTrailsFor(session.sub);
  return (
    <div className="trails">
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <TrailList trails={trails} />
      </div>
      <div style={{ maxWidth: 620 }}>
        <div className="trail-head">
          <div>
            <h1>Trails</h1>
            <p>A trail is a board with an order. Line pieces up as a path, write a note at each stop about why it&apos;s there, and invite people to build it with you.</p>
          </div>
        </div>
        <fieldset>
          <legend>Start a trail</legend>
          <NewTrailForm />
        </fieldset>
        <p className="hint" style={{ marginTop: 16 }}>You can also add any piece to a trail from its page.</p>
      </div>
    </div>
  );
}
