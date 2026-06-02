import { getToken } from '@/features/auth/server';
import type { Exam } from '@/features/exams/types';
import { serverApi } from '@/shared/api/server';

export type { Exam } from '@/features/exams/types';

export const getExams = async (): Promise<Exam[]> => {
  const token = await getToken();
  if (!token) return [];
  const res = await serverApi.get<{ data: { exams: Exam[] } }>('/exams', token);
  return res.data.exams;
};
