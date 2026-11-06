'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Discover', match: (p: string) => p === '/' || p.startsWith('/piece') || p.startsWith('/maker') },
  { href: '/trails', label: 'Trails', match: (p: string) => p.startsWith('/trails') },
  { href: '/share', label: 'Share', match: (p: string) => p.startsWith('/share') },
];

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const links = isAdmin
    ? [...LINKS, { href: '/review', label: 'Review', match: (p: string) => p.startsWith('/review') }]
    : LINKS;
  return (
    <nav className="nav" aria-label="Main">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={l.match(path) ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
