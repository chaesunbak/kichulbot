import { notFound, redirect } from 'next/navigation';

import { ResultSession } from '@/features/learning/components/result-session';
import { getSolveSession } from '@/features/learning/api';
import type { SolveSession } from '@/features/learning/types';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let session: SolveSession;
  try {
    session = await getSolveSession(id);
  } catch {
    notFound();
  }

  if (!session.submittedAt) redirect(`/solve/${session.id}`);

  return <ResultSession session={session} />;
}
