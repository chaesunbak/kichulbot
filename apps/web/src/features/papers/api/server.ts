import { cache } from 'react';
import { serverApi } from '@/shared/api/server';
import { getToken } from '@/features/auth/server';
import type { Paper } from '@/features/papers/types';

export type { Paper, Taxonomy } from '@/features/papers/types';

export const getPapers = cache(async (): Promise<Paper[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { papers: Paper[] } }>(
    '/exam-papers',
    token,
  );
  return res.data.papers;
});

export const getPaper = cache(async (id: string): Promise<Paper> => {
  const token = await getToken();
  if (!token) throw new Error('인증 정보가 없습니다.');
  const res = await serverApi.get<{ data: { paper: Paper } }>(
    `/exam-papers/${id}`,
    token,
  );
  return res.data.paper;
});
