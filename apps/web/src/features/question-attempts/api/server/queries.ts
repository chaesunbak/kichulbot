import { getToken } from '@/features/auth/api/server/queries';
import type { QuestionAttempt } from '@/features/question-attempts/types';
import { serverApi } from '@/shared/api/server';

export const getQuestionAttempts = async (
  from: string,
  to: string,
  options: { includeTags?: boolean } = {},
): Promise<QuestionAttempt[]> => {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams({ from, to });
  if (options.includeTags) {
    params.set('includeTags', 'true');
  }
  const res = await serverApi.get<{
    data: { questionAttempts: QuestionAttempt[] };
  }>(`/me/question-attempts?${params.toString()}`, token);

  return res.data.questionAttempts;
};
