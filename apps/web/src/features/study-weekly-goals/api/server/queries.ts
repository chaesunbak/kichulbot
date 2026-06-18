import { ApiError } from '@kichulbot/api-contract';

import { getAuthContext } from '@/features/auth/lib/server-auth';
import type { StudyWeeklyGoal } from '@/features/study-weekly-goals/types';
import { serverApi } from '@/shared/api/server';

export const getCurrentStudyWeeklyGoal = async (): Promise<StudyWeeklyGoal> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');

  const res = await serverApi.get<{
    data: { goal: StudyWeeklyGoal };
  }>('/me/study-weekly-goals/current', context.token);

  return res.data.goal;
};
