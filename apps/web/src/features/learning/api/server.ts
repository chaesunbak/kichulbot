import { getToken } from '@/features/auth/server';
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

export const getSolveSessionLogs = async (): Promise<SolveSessionLog[]> => {
  const logs: SolveSessionLog[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await getSolveSessionLogPage({ page, limit: 100 });
    logs.push(...result.logs);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return logs;
};

type GetSolveSessionLogPageOptions = {
  status?: SolveSessionLogStatus;
  page?: number;
  limit?: number;
};

export const getSolveSessionLogPage = async ({
  status = 'all',
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
  const res = await serverApi.get<{ data: SolveSessionLogPage }>(
    `/me/solve-sessions?${query}`,
    token,
  );
  return res.data;
};

export const getTodayWrongQuestions =
  async (): Promise<DailyWrongQuestionSet | null> => {
    const token = await getToken();
    if (!token) return null;
    const res = await serverApi.post<{
      data: { questionSet: DailyWrongQuestionSet };
    }>('/me/wrong-question-sets', {}, token);
    return res.data.questionSet;
  };
