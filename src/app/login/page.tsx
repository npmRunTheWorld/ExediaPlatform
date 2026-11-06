import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { env } from '@/lib/env';
import LoginClient from './LoginClient';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await getSession()) redirect('/');
  // The Google client id is public by design. Reading it here means the old
  // REACT_APP_ variable keeps working without a NEXT_PUBLIC_ copy.
  return <LoginClient clientId={env.googleClientId} />;
}
