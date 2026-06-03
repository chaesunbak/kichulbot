import { getToken } from '@/features/auth/server';
import type { Category, Exam } from '@/features/exams/types';
import { ApiError, serverApi } from '@/shared/api/server';

export type { Category, Exam } from '@/features/exams/types';

export const getExams = async (): Promise<Exam[]> => {
  const token = await getToken();
  const path = token ? '/exams' : '/public/exams';
  const res = await serverApi
    .get<{ data: { exams: Exam[] } }>(path, token ?? undefined)
    .catch((error: unknown) => {
      if (token && error instanceof ApiError && error.status === 401) {
        return serverApi.get<{ data: { exams: Exam[] } }>('/public/exams');
      }
      throw error;
    });
  return res.data.exams;
};

export const getCategories = async (): Promise<Category[]> => {
  const token = await getToken();
  const path = token ? '/categories' : '/public/categories';
  const res = await serverApi
    .get<{ data: { categories: Category[] } }>(path, token ?? undefined)
    .catch((error: unknown) => {
      if (token && error instanceof ApiError && error.status === 401) {
        return serverApi.get<{ data: { categories: Category[] } }>(
          '/public/categories',
        );
      }
      throw error;
    });
  return res.data.categories;
};
