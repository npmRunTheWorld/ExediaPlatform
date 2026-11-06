import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import { getSession } from '@/lib/session';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <>
      <Suspense>
        <Header session={session} />
      </Suspense>
      <main>{children}</main>
    </>
  );
}
