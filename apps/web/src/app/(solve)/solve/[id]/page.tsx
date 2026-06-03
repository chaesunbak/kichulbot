import { notFound, redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getSolveSession } from '@/features/learning/api/server';
import { SolveSession } from '@/features/learning/components/solve-session';
import type { SolveSession as SolveSessionData } from '@/features/learning/types';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCachedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/solve/${id}`)}`);

  let session: SolveSessionData;
  try {
    session = await getSolveSession(id);
  } catch {
    notFound();
  }

  if (session.submittedAt) redirect(`/results/${session.id}`);

  return <SolveSession initialSession={session} />;
}
