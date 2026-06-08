import { notFound, redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getSolveSession } from '@/features/learning/api/server';
import { ResultSession } from '@/features/learning/components/result-session';
import type { SolveSession } from '@/features/learning/types';
import { ApiError } from '@/shared/api/server';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCachedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/results/${id}`)}`);

  let session: SolveSession;
  try {
    session = await getSolveSession(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    console.error('풀이 결과를 불러오지 못했습니다.', { id, error });
    throw error;
  }

  if (!session.submittedAt) redirect(`/solve/${session.id}`);

  return <ResultSession session={session} />;
}
