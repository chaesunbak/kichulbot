import { redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';

export default async function LegacyLibraryPaperPage() {
  const user = await getUser();
  if (!user) redirect('/login?next=/library');

  redirect('/library');
}
