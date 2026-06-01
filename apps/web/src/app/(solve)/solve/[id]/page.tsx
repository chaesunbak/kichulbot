import { notFound, redirect } from 'next/navigation';

import { SolveSession } from '@/components/solve-session';
import { getAnswerSession } from '@/lib/learning';
import type { AnswerSession } from '@/lib/learning.types';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let session: AnswerSession;
  try {
    session = await getAnswerSession(id);
  } catch {
    notFound();
  }

  if (session.submittedAt) redirect(`/results/${session.id}`);

  return <SolveSession initialSession={session} />;
}
