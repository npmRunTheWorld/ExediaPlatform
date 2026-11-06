'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { sized } from './Tile';

type Shot = { key: string; url: string; w?: number | null; h?: number | null; label: string };

// Finished piece plus process shots. The scrubber walks from the first sketch to
// the final image, so viewers see how it was made.
export default function ProcessViewer({ title, shots }: { title: string; shots: Shot[] }) {
  const [at, setAt] = useState(shots.length - 1);
  const current = shots[at];

  return (
    <div className="stage">
      <img
        className="big"
        src={sized(current.url, 1400)}
        alt={at === shots.length - 1 ? title : `${title}, ${current.label.toLowerCase()}`}
        width={current.w ?? undefined}
        height={current.h ?? undefined}
      />
      {shots.length > 1 && (
        <>
          <label className="hint">
            <span className="sr">Process step</span>
            <input
              className="scrub"
              type="range"
              min={0}
              max={shots.length - 1}
              value={at}
              onChange={(e) => setAt(Number(e.target.value))}
              aria-valuetext={current.label}
            />
          </label>
          <div className="steps" role="group" aria-label="Process steps">
            {shots.map((s, i) => (
              <button key={s.key} type="button" className="step" aria-pressed={i === at} onClick={() => setAt(i)}>
                <img src={sized(s.url, 200)} alt="" loading="lazy" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
