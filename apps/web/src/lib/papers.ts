import { cache } from 'react';
import { api } from './api';
import { getToken } from './auth';

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
}

export interface Paper {
  id: string;
  title: string;
  year: number;
  month: number | null;
  grade: number | null;
  round: number | null;
  questionCount: number;
  isInLibrary: boolean;
  exam: Taxonomy;
  subject: Taxonomy;
}

export const getPapers = cache(async (): Promise<Paper[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await api.get<{ data: { papers: Paper[] } }>(
    '/exam-papers',
    token,
  );
  return res.data.papers;
});

export const getPaper = cache(async (id: string): Promise<Paper> => {
  const token = await getToken();
  if (!token) throw new Error('인증 정보가 없습니다.');
  const res = await api.get<{ data: { paper: Paper } }>(
    `/exam-papers/${id}`,
    token,
  );
  return res.data.paper;
});
