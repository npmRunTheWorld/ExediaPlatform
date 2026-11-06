import { getSession } from '@/lib/session';
import { CATEGORIES } from '@/lib/validate';
import ShareForm from './ShareForm';

export const metadata = { title: 'Share a piece' };

export default async function SharePage() {
  const session = (await getSession())!;
  return <ShareForm me={{ name: session.name, picture: session.picture }} categories={[...CATEGORIES]} />;
}
