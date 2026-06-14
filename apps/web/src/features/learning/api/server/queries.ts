import { ApiError } from '@kichulbot/api-contract';

import { getToken } from '@/features/auth/api/server/queries';
import type {
  DailyWrongQuestionSet,
  SolveSession,
  SolveSessionLog,
  SolveSessionLogPage,
  SolveSessionLogStatus,
} from '@/features/learning/types';
import { serverApi } from '@/shared/api/server';

export const getSolveSession = async (id: string): Promise<SolveSession> => {
  const token = await getToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await serverApi.get<{ data: { session: SolveSession } }>(
    `/me/solve-sessions/${id}`,
    token,
  );
  return res.data.session;
};

type GetSolveSessionLogsOptions = {
  status?: SolveSessionLogStatus;
  submittedDate?: string;
};

export const getSolveSessionLogs = async ({
  status = 'all',
  submittedDate,
}: GetSolveSessionLogsOptions = {}): Promise<SolveSessionLog[]> => {
  const logs: SolveSessionLog[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await getSolveSessionLogPage({
      status,
      submittedDate,
      page,
      limit: 100,
    });
    logs.push(...result.logs);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return logs;
};

type GetSolveSessionLogPageOptions = {
  status?: SolveSessionLogStatus;
  submittedDate?: string;
  page?: number;
  limit?: number;
};

export const getSolveSessionLogPage = async ({
  status = 'all',
  submittedDate,
  page = 1,
  limit = 20,
}: GetSolveSessionLogPageOptions = {}): Promise<SolveSessionLogPage> => {
  const token = await getToken();
  if (!token) {
    return { logs: [], total: 0, page, limit, totalPages: 0 };
  }
  const query = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
  });
  if (submittedDate) query.set('submittedDate', submittedDate);
  const res = await serverApi
    .get<{ data: SolveSessionLogPage }>(`/me/solve-sessions?${query}`, token)
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    });
  return res?.data ?? { logs: [], total: 0, page, limit, totalPages: 0 };
};

export const getTodayWrongQuestions =
  async (): Promise<DailyWrongQuestionSet | null> => {
    const token = await getToken();
    if (!token) return null;
    const res = await serverApi
      .get<{
        data: { questionSet: DailyWrongQuestionSet | null };
      }>('/me/wrong-question-sets', token)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      });
    if (!res) return null;
    return res.data.questionSet;
  };
