import { getToken } from '@/features/auth/server';
import type { Paper } from '@/features/papers/types';
import { serverApi } from '@/shared/api/server';

export type { Paper, Taxonomy } from '@/features/papers/types';

export const getPapers = async (): Promise<Paper[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { papers: Paper[] } }>(
    '/exam-papers',
    token,
  );
  return res.data.papers;
};

export const getPapersByExamId = async (examId: string): Promise<Paper[]> => {
  const token = await getToken();
  if (!token) return [];
  const query = new URLSearchParams({ examId }).toString();
  const res = await serverApi.get<{ data: { papers: Paper[] } }>(
    `/exam-papers?${query}`,
    token,
  );
  return res.data.papers;
};

export const getPaper = async (id: string): Promise<Paper> => {
  const token = await getToken();
  if (!token) throw new Error('인증 정보가 없습니다.');
  const res = await serverApi.get<{ data: { paper: Paper } }>(
    `/exam-papers/${id}`,
    token,
  );
  return res.data.paper;
};
