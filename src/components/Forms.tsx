'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addComment, reportPiece, addToTrail, createTrail, updateProfile, addCollaborator, type FormState } from '@/app/actions';
import { REPORT_REASONS } from '@/lib/validate';

export function Submit({ children, className = 'btn ink' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? 'Working…' : children}
    </button>
  );
}

export function Msg({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="msg err" role="alert">{state.error}</p>;
  if (state.ok) return <p className="msg ok" role="status">{state.ok}</p>;
  return null;
}

export function CommentForm({ id }: { id: string }) {
  const [state, action] = useActionState(addComment, null);
  return (
    <form action={action} className="stacked" style={{ gap: 8 }}>
      <input type="hidden" name="id" value={id} />
      <label>
        <span className="sr">Comment</span>
        <textarea name="comment" maxLength={1000} required placeholder="Say something kind or useful" />
      </label>
      <div className="row"><Submit className="btn small">Post comment</Submit><Msg state={state} /></div>
    </form>
  );
}

export function ReportForm({ id }: { id: string }) {
  const [state, action] = useActionState(reportPiece, null);
  if (state?.ok) return <Msg state={state} />;
  return (
    <form action={action} className="stacked" style={{ gap: 10 }}>
      <input type="hidden" name="id" value={id} />
      <div className="radios" role="radiogroup" aria-label="Reason">
        {Object.entries(REPORT_REASONS).map(([value, label]) => (
          <label className="radio" key={value}>
            <input type="radio" name="reason" value={value} required />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <label>Anything else? <span className="hint">Optional. A link to the original helps.</span>
        <textarea name="details" maxLength={1000} />
      </label>
      <p className="hint" style={{ margin: 0 }}>Reports go to a person. A missing credential or label alone is not proof of anything.</p>
      <div className="row"><Submit className="btn small">Send report</Submit><Msg state={state} /></div>
    </form>
  );
}

export function AddToTrail({ pieceId, trails }: { pieceId: string; trails: { _id: string; title: string }[] }) {
  const [state, action] = useActionState(addToTrail, null);
  const [newState, newAction] = useActionState(createTrail, null);
  return (
    <div className="stacked" style={{ display: 'grid', gap: 14 }}>
      {trails.length > 0 && (
        <form action={action} className="stacked" style={{ gap: 8 }}>
          <input type="hidden" name="pieceId" value={pieceId} />
          <label>Trail
            <select name="trailId" required defaultValue="">
              <option value="" disabled>Pick one</option>
              {trails.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </label>
          <label>Note for this stop <span className="hint">Why it belongs here. Optional.</span>
            <textarea name="note" maxLength={500} />
          </label>
          <div className="row"><Submit className="btn small">Add to trail</Submit><Msg state={state} /></div>
        </form>
      )}
      <form action={newAction} className="stacked" style={{ gap: 8 }}>
        <input type="hidden" name="pieceId" value={pieceId} />
        <label>{trails.length ? 'Or start a new trail' : 'Start a trail with this piece'}
          <input type="text" name="title" maxLength={80} required placeholder="Ink washes I want to try" />
        </label>
        <div className="row"><Submit className="btn small">Create trail</Submit><Msg state={newState} /></div>
      </form>
    </div>
  );
}

export function NewTrailForm() {
  const [state, action] = useActionState(createTrail, null);
  return (
    <form action={action} className="stacked" style={{ gap: 8 }}>
      <label>Name<input type="text" name="title" maxLength={80} required placeholder="Ink washes I want to try" /></label>
      <label>What is it for? <span className="hint">Optional</span><textarea name="about" maxLength={500} /></label>
      <div className="row"><Submit className="btn small">Create trail</Submit><Msg state={state} /></div>
    </form>
  );
}

export function CollaboratorForm({ trailId }: { trailId: string }) {
  const [state, action] = useActionState(addCollaborator, null);
  return (
    <form action={action} className="stacked" style={{ gap: 8 }}>
      <input type="hidden" name="trailId" value={trailId} />
      <label>Add a collaborator <span className="hint">Paste a link to their Exedia profile.</span>
        <input type="text" name="maker" maxLength={300} required placeholder="https://…/maker/…" />
      </label>
      <div className="row"><Submit className="btn small">Add</Submit><Msg state={state} /></div>
    </form>
  );
}

export function ProfileForm({ bio, commissions, contactUrl }: { bio: string; commissions: boolean; contactUrl: string }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="stacked" style={{ gap: 10 }}>
      <label>About you<textarea name="bio" maxLength={300} defaultValue={bio} placeholder="What you make and how" /></label>
      <label>Open for commissions?
        <select name="commissions" defaultValue={commissions ? 'yes' : 'no'}>
          <option value="no">Not right now</option>
          <option value="yes">Yes</option>
        </select>
      </label>
      <label>How to reach you <span className="hint">A website, a form, or mailto:you@example.com</span>
        <input type="text" name="contactUrl" maxLength={300} defaultValue={contactUrl} />
      </label>
      <div className="row"><Submit className="btn small">Save profile</Submit><Msg state={state} /></div>
    </form>
  );
}
