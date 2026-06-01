import { serverApi } from '@/shared/api/server';
import { getToken } from '@/features/auth/server';
import type {
  DailyWrongQuestionSet,
  SolveSession,
  SolveSessionLog,
} from '@/features/learning/types';

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
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { logs: SolveSessionLog[] } }>(
    '/me/solve-sessions',
    token,
  );
  return res.data.logs;
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
