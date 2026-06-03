import { getToken } from '@/features/auth/server';
import type { Paper } from '@/features/papers/types';
import { serverApi } from '@/shared/api/server';

export type { Paper, Taxonomy } from '@/features/papers/types';

export interface PaperSearchFilters {
  examId?: string | null;
  categoryId?: string | null;
  q?: string | null;
}

function toPaperQuery(filters: PaperSearchFilters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const normalized = value?.trim();
    if (normalized) query.set(key, normalized);
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export const getPapers = async (
  filters: PaperSearchFilters = {},
): Promise<Paper[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { papers: Paper[] } }>(
    `/exam-papers${toPaperQuery(filters)}`,
    token,
  );
  return res.data.papers;
};

export const getPapersByExamId = async (examId: string): Promise<Paper[]> => {
  return getPapers({ examId });
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
