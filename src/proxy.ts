import { NextResponse, type NextRequest } from 'next/server';
import { readSessionToken, SESSION_COOKIE } from '@/lib/session';

// Same rule as the old app: everything except the login and privacy pages needs
// a signed-in user. The difference is the session is now a signed cookie checked
// here, not a value in localStorage the browser could edit.
const PUBLIC = ['/login', '/privacy-policy'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();

  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/|media/|favicon|exediaLogo|logo|manifest|robots).*)'],
};
