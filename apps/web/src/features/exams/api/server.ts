import { getToken } from '@/features/auth/server';
import type { Category, Exam } from '@/features/exams/types';
import { serverApi } from '@/shared/api/server';

export type { Category, Exam } from '@/features/exams/types';

export const getExams = async (): Promise<Exam[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { exams: Exam[] } }>('/exams', token);
  return res.data.exams;
};

export const getCategories = async (): Promise<Category[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { categories: Category[] } }>(
    '/categories',
    token,
  );
  return res.data.categories;
};
