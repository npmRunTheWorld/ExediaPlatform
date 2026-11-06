'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
        const next = new URLSearchParams();
        if (q) next.set('q', q);
        next.set('feed', 'all');
        router.push(`/?${next.toString()}`);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        name="q"
        type="search"
        defaultValue={params.get('q') ?? ''}
        placeholder="Search work, makers, or materials like gouache"
        aria-label="Search"
        maxLength={80}
      />
    </form>
  );
}
