'use client';
/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useState } from 'react';
import { sharePiece } from '@/app/actions';
import { Msg, Submit } from '@/components/Forms';
import Avatar from '@/components/Avatar';
import { extractPalette } from '@/lib/color';

const MAX_MAIN_MB = 12;
const MAX_STEP_MB = 4;
const MAX_STEPS = 6;

// Reads a downscaled copy of the image in a canvas and pulls its main colors.
async function paletteOf(file: File): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 120 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return extractPalette(ctx.getImageData(0, 0, w, h).data, 5);
}

export default function ShareForm({ me, categories }: { me: { name: string; picture: string }; categories: string[] }) {
  const [state, action] = useActionState(sharePiece, null);
  const [title, setTitle] = useState('');
  const [mainUrl, setMainUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [ai, setAi] = useState<'none' | 'assisted' | 'mostly'>('none');
  const [own, setOwn] = useState<'me' | 'other'>('me');
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => () => { if (mainUrl) URL.revokeObjectURL(mainUrl); }, [mainUrl]);
  useEffect(() => () => steps.forEach((u) => URL.revokeObjectURL(u)), [steps]);

  const checks = [
    { done: !!mainUrl, label: 'Finished image added' },
    { done: !!title.trim(), label: 'Title' },
    { done: steps.length > 0, label: 'Process shots (optional, earns the stamp)' },
    { done: ai !== 'mostly', label: 'AI use declared' },
  ];

  return (
    <div className="post">
      <div>
        <h1>Share a piece</h1>
        <p className="muted" style={{ margin: '0 0 20px', maxWidth: '60ch' }}>
          Process shots are optional. Work that shows them gets the Process shown stamp and is more likely to be picked for Today&apos;s edit.
        </p>
        <form action={action} className="stacked">
          <fieldset>
            <legend>The finished piece</legend>
            <label>Image
              <span className="hint">JPG, PNG, WebP or GIF, up to {MAX_MAIN_MB} MB. If the file has Content Credentials, we show that.</span>
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/gif"
                required
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  setFileError(null);
                  if (mainUrl) URL.revokeObjectURL(mainUrl);
                  if (!file) { setMainUrl(null); setPalette([]); return; }
                  if (file.size > MAX_MAIN_MB * 1024 * 1024) {
                    setFileError(`That file is over ${MAX_MAIN_MB} MB.`);
                    e.target.value = '';
                    setMainUrl(null);
                    return;
                  }
                  setMainUrl(URL.createObjectURL(file));
                  try { setPalette(await paletteOf(file)); } catch { setPalette([]); }
                }}
              />
            </label>
            <input type="hidden" name="palette" value={JSON.stringify(palette)} />
            {palette.length > 0 && (
              <div className="pal" aria-label="Colors we found">
                {palette.map((hex) => <span key={hex} style={{ flex: 1, background: hex }} title={hex} />)}
              </div>
            )}
            <label>Title<input type="text" name="title" maxLength={120} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Harbour at 6am" /></label>
            <label>A line about it<textarea name="about" maxLength={1500} placeholder="What were you trying to get right?" /></label>
            <label>Category
              <select name="category" required defaultValue="">
                <option value="" disabled>Pick one</option>
                {categories.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>How you got there</legend>
            <label>Process shots
              <span className="hint">Sketches, early passes, a photo of your table. Up to {MAX_STEPS}, {MAX_STEP_MB} MB each, in order.</span>
              <input
                type="file"
                name="process"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  setFileError(null);
                  if (files.length > MAX_STEPS) {
                    setFileError(`Pick up to ${MAX_STEPS} process shots.`);
                    e.target.value = '';
                    setSteps([]);
                    return;
                  }
                  if (files.some((f) => f.size > MAX_STEP_MB * 1024 * 1024)) {
                    setFileError(`Each process shot must be under ${MAX_STEP_MB} MB.`);
                    e.target.value = '';
                    setSteps([]);
                    return;
                  }
                  setSteps(files.map((f) => URL.createObjectURL(f)));
                }}
              />
            </label>
            {steps.length > 0 && <div className="thumbs">{steps.map((u, i) => <img key={u} src={u} alt={`Step ${i + 1}`} />)}</div>}
            <label>Medium and tools<input type="text" name="medium" maxLength={200} placeholder="Gouache on cold press, Procreate for cleanup" /></label>
          </fieldset>

          <fieldset>
            <legend>AI use</legend>
            <div className="radios" role="radiogroup" aria-label="AI use">
              <label className="radio"><input type="radio" name="ai" value="none" checked={ai === 'none'} onChange={() => setAi('none')} />
                <span><b>None</b><span className="hint">Made without generative tools.</span></span></label>
              <label className="radio"><input type="radio" name="ai" value="assisted" checked={ai === 'assisted'} onChange={() => setAi('assisted')} />
                <span><b>Assisted</b><span className="hint">You made it, and a tool helped with upscaling, cleanup or a background fill. It gets a visible label.</span></span></label>
              <label className="radio"><input type="radio" name="ai" value="mostly" checked={ai === 'mostly'} onChange={() => setAi('mostly')} />
                <span><b>Mostly generated</b><span className="hint">Exedia only hosts work made by people, so these can&apos;t be posted.</span></span></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Credit</legend>
            <div className="radios" role="radiogroup" aria-label="Who made it">
              <label className="radio"><input type="radio" name="own" value="me" checked={own === 'me'} onChange={() => setOwn('me')} />
                <span><b>I made this</b></span></label>
              <label className="radio"><input type="radio" name="own" value="other" checked={own === 'other'} onChange={() => setOwn('other')} />
                <span><b>Someone else made it</b><span className="hint">Add their name and where you found it. Their name goes first on the piece.</span></span></label>
            </div>
            {own === 'other' && (
              <>
                <label>Maker&apos;s name<input type="text" name="sourceName" maxLength={120} required /></label>
                <label>Link to the original<input type="url" name="sourceUrl" required placeholder="https://" /></label>
              </>
            )}
            <label>Link <span className="hint">Optional. A shop, a tutorial, your site.</span>
              <input type="url" name="destination" placeholder="https://" />
            </label>
            {own === 'me' && (
              <label>Open for commissions?
                <select name="commissions" defaultValue="no">
                  <option value="no">Not right now</option>
                  <option value="yes">Yes, people can contact me</option>
                </select>
              </label>
            )}
          </fieldset>

          {fileError && <p className="msg err" role="alert">{fileError}</p>}
          <Msg state={state} />
          <div className="row">
            {ai === 'mostly'
              ? <button className="btn primary" type="button" disabled>Post to Exedia</button>
              : <Submit className="btn primary">Post to Exedia</Submit>}
          </div>
        </form>
      </div>

      <aside className="preview" aria-label="Preview">
        <span className="mono muted">How it will look</span>
        <div className="tile">
          {mainUrl ? <img className="art" src={mainUrl} alt="" /> : <div className="ph">Your image shows here</div>}
          <div className="badges">
            {steps.length > 0 && <span className="badge b-proc"><i />Process shown</span>}
            {ai === 'assisted' && <span className="badge b-ai"><i />AI assisted</span>}
          </div>
          <span className="meta">
            <span className="t">{title.trim() || 'Untitled'}</span>
            <span className="byline"><Avatar person={{ userName: me.name, image: me.picture }} /><span>{me.name}</span></span>
          </span>
        </div>
        <ul className="checks">
          {checks.map((c) => <li key={c.label} className={c.done ? 'done' : undefined}>{c.label}</li>)}
        </ul>
      </aside>
    </div>
  );
}
