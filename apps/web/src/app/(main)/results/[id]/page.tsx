import { ApiError } from '@kichulbot/api-contract';
import { notFound, redirect } from 'next/navigation';

import { redirectToLoginIfUnauthorized } from '@/features/auth/lib/auth-redirect';
import { getSolveSession } from '@/features/learning/api/server/queries';
import { ResultSession } from '@/features/learning/components/result-session';
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
  } catch (error) {
    redirectToLoginIfUnauthorized(error, `/results/${id}`);
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    console.error('풀이 결과를 불러오지 못했습니다.', { id, error });
    throw error;
  }

  if (!session.submittedAt) redirect(`/solve/${session.id}`);

  return <ResultSession session={session} />;
}
