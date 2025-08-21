import { getSessionUser } from '@/lib/auth';
import Login from '@/components/ui/Login';
import { Browse } from '@/components/browse/Browse';

export default async function HomePage() {
  const user = "pouet"; //await getSessionUser(); // remplacer par cookies() si RSC
  return user ? <Browse /> : <Login />;
}
