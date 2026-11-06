/* eslint-disable @next/next/no-img-element */
import type { Person } from '@/lib/types';

function initials(name?: string | null) {
  const parts = (name ?? '?').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function Avatar({ person, className = 'avatar' }: { person?: Pick<Person, 'userName' | 'image'> | null; className?: string }) {
  if (person?.image) {
    return <img className={className} src={person.image} alt="" referrerPolicy="no-referrer" loading="lazy" />;
  }
  return <span className={className} aria-hidden="true">{initials(person?.userName)}</span>;
}
