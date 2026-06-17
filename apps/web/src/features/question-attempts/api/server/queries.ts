import { ApiError } from '@kichulbot/api-contract';

import { getAuthContext } from '@/features/auth/lib/server-auth';
import type { QuestionAttempt } from '@/features/question-attempts/types';
import { serverApi } from '@/shared/api/server';

export const getQuestionAttempts = async (
  from: string,
  to: string,
  options: { includeTags?: boolean } = {},
): Promise<QuestionAttempt[]> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');

  const params = new URLSearchParams({ from, to });
  if (options.includeTags) {
    params.set('includeTags', 'true');
  }
  const res = await serverApi.get<{
    data: { questionAttempts: QuestionAttempt[] };
  }>(`/me/question-attempts?${params.toString()}`, context.token);

  return res.data.questionAttempts;
};
