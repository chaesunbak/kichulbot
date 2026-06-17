import { getAuthContext } from '@/features/auth/lib/server-auth';
import type { Paper, PaperQuestion } from '@/features/papers/types';
import { serverApi } from '@/shared/api/server';

export type { Paper, Taxonomy } from '@/features/papers/types';

export interface PaperSearchFilters {
  examId?: string | null;
  categoryId?: string | null;
  q?: string | null;
}

const PUBLIC_RESOURCE_REVALIDATE_SECONDS = 300;

const publicResourceCacheOptions = {
  next: { revalidate: PUBLIC_RESOURCE_REVALIDATE_SECONDS },
};

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
  const token = (await getAuthContext())?.token;
  const path = token ? '/exam-papers' : '/public/exam-papers';
  const query = toPaperQuery(filters);
  const res = await serverApi.get<{ data: { papers: Paper[] } }>(
    `${path}${query}`,
    token ?? undefined,
  );
  return res.data.papers;
};

export const getPublicPapers = async (
  filters: PaperSearchFilters = {},
): Promise<Paper[]> => {
  const query = toPaperQuery(filters);
  const res = await serverApi.get<{ data: { papers: Paper[] } }>(
    `/public/exam-papers${query}`,
    undefined,
    publicResourceCacheOptions,
  );
  return res.data.papers;
};

export const getPapersByExamId = async (examId: string): Promise<Paper[]> => {
  return getPapers({ examId });
};

export const getPaper = async (id: string): Promise<Paper> => {
  const token = (await getAuthContext())?.token;
  const path = token ? '/exam-papers' : '/public/exam-papers';
  const res = await serverApi.get<{ data: { paper: Paper } }>(
    `${path}/${id}`,
    token ?? undefined,
  );
  return res.data.paper;
};

export const getPublicPaper = async (id: string): Promise<Paper> => {
  const res = await serverApi.get<{ data: { paper: Paper } }>(
    `/public/exam-papers/${id}`,
    undefined,
    publicResourceCacheOptions,
  );
  return res.data.paper;
};

export const getPaperQuestions = async (
  id: string,
): Promise<{ paper: Paper; questions: PaperQuestion[] }> => {
  const token = (await getAuthContext())?.token;
  const path = token ? '/exam-papers' : '/public/exam-papers';
  const res = await serverApi.get<{
    data: { paper: Paper; questions: PaperQuestion[] };
  }>(`${path}/${id}/questions`, token ?? undefined);
  return res.data;
};

export const getPublicPaperQuestions = async (
  id: string,
): Promise<{ paper: Paper; questions: PaperQuestion[] }> => {
  const res = await serverApi.get<{
    data: { paper: Paper; questions: PaperQuestion[] };
  }>(
    `/public/exam-papers/${id}/questions`,
    undefined,
    publicResourceCacheOptions,
  );
  return res.data;
};
