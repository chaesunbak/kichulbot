import { getToken } from '@/features/auth/server';
import type { QuestionAttempt } from '@/features/question-attempts/types';
import { serverApi } from '@/shared/api/server';

export const getQuestionAttempts = async (
  from: string,
  to: string,
): Promise<QuestionAttempt[]> => {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams({ from, to });
  const res = await serverApi.get<{
    data: { questionAttempts: QuestionAttempt[] };
  }>(`/me/question-attempts?${params.toString()}`, token);

  return res.data.questionAttempts;
};
