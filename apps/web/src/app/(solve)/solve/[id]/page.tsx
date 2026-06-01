import { notFound, redirect } from 'next/navigation';

import { SolveSession } from '@/components/solve-session';
import { getSolveSession } from '@/lib/learning';
import type { SolveSession as SolveSessionData } from '@/lib/learning.types';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let session: SolveSessionData;
  try {
    session = await getSolveSession(id);
  } catch {
    notFound();
  }

  if (session.submittedAt) redirect(`/results/${session.id}`);

  return <SolveSession initialSession={session} />;
}
