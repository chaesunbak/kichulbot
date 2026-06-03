import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';

export default async function LegacyLibraryPaperPage() {
  const user = await getCachedUser();
  if (!user) redirect('/login?next=/library');

  redirect('/library');
}
