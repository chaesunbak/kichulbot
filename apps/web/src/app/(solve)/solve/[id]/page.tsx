import { ApiError } from '@kichulbot/api-contract';
import { notFound, redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';
import { getSolveSession } from '@/features/learning/api/server/queries';
import { SolveSession } from '@/features/learning/components/solve-session';
import type { SolveSession as SolveSessionData } from '@/features/learning/types';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/solve/${id}`)}`);

  let session: SolveSessionData;
  try {
    session = await getSolveSession(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    console.error('풀이 세션을 불러오지 못했습니다.', { id, error });
    throw error;
  }

  if (session.submittedAt) redirect(`/results/${session.id}`);

  return <SolveSession initialSession={session} />;
}
