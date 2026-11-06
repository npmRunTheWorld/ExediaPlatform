import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { env } from './env';

export const SESSION_COOKIE = 'exedia_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = {
  sub: string;
  name: string;
  picture: string;
  isAdmin: boolean;
};

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

// The old app decoded the Google token in the browser and trusted it. Here the
// signature, issuer, audience and expiry are all checked on the server.
export async function verifyGoogleCredential(credential: string) {
  const { payload } = await jwtVerify(credential, googleKeys, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: env.googleClientId,
  });
  if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Google token has no subject');
  return {
    sub: payload.sub,
    name: typeof payload.name === 'string' ? payload.name : 'Someone',
    picture: typeof payload.picture === 'string' ? payload.picture : '',
  };
}

export async function signSession(user: { sub: string; name: string; picture: string }) {
  return new SignJWT({ name: user.name, picture: user.picture })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(env.sessionSecret);
}

export async function readSessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, env.sessionSecret, { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      name: String(payload.name ?? ''),
      picture: String(payload.picture ?? ''),
      isAdmin: !!env.adminSub && payload.sub === env.adminSub,
    };
  } catch {
    return null;
  }
}

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('Sign in first');
  return session;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
