import { ApiError } from '@kichulbot/api-contract';
import type {
  ActiveUsersResponse,
  StudyStreakResponse,
  StudyTimeResponse,
} from '@kichulbot/api-contract/study-activity';

import { getAuthContext } from '@/features/auth/lib/server-auth';
import { serverApi } from '@/shared/api/server';

export const getStudyStreak = async (): Promise<StudyStreakResponse> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');

  const res = await serverApi.get<{ data: StudyStreakResponse }>(
    '/me/study-streak',
    context.token,
  );
  return res.data;
};

export const getStudyTime = async (
  date?: string,
): Promise<StudyTimeResponse> => {
  const context = await getAuthContext();
  if (!context) throw new ApiError(401, '로그인이 필요합니다.');

  const query = date ? `?${new URLSearchParams({ date })}` : '';
  const res = await serverApi.get<{ data: StudyTimeResponse }>(
    `/me/study-time${query}`,
    context.token,
  );
  return res.data;
};

export const getActiveUsers = async (
  date?: string,
): Promise<ActiveUsersResponse> => {
  const query = date ? `?${new URLSearchParams({ date })}` : '';
  const res = await serverApi.get<{ data: ActiveUsersResponse }>(
    `/public/active-users${query}`,
  );
  return res.data;
};
