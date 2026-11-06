import Link from 'next/link';
import Avatar from './Avatar';
import NavLinks from './NavLinks';
import SearchBox from './SearchBox';
import { signOut } from '@/app/actions';
import type { Session } from '@/lib/session';

export default function Header({ session }: { session: Session }) {
  return (
    <header className="top">
      <div className="top-in">
        <Link className="brand" href="/" aria-label="Exedia home">
          <span className="brand-mark"><span /></span>
          <b>Exedia</b>
        </Link>
        <NavLinks isAdmin={session.isAdmin} />
        <SearchBox />
        <details className="me-menu">
          <summary aria-label="Your account">
            <Avatar person={{ userName: session.name, image: session.picture }} />
          </summary>
          <div className="menu">
            <Link href={`/maker/${session.sub}`}>Your profile</Link>
            <Link href="/trails">Your trails</Link>
            {session.isAdmin && <Link href="/review">Review queue</Link>}
            <Link href="/privacy-policy">Privacy policy</Link>
            <form action={signOut}>
              <button type="submit">Sign out</button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
