import { notFound, redirect } from 'next/navigation';

import { ResultSession } from '@/components/result-session';
import { getAnswerSession } from '@/lib/learning';
import type { AnswerSession } from '@/lib/learning.types';

export default async function ResultPage({
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

  if (!session.submittedAt) redirect(`/solve/${session.id}`);

  return <ResultSession session={session} />;
}
