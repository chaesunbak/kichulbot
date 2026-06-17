import { getAuthContext } from '@/features/auth/lib/server-auth';
import type { Category, Exam, ExamPaperOverview } from '@/features/exams/types';
import { serverApi } from '@/shared/api/server';

export type { Category, Exam, ExamPaperOverview } from '@/features/exams/types';

const PUBLIC_RESOURCE_REVALIDATE_SECONDS = 300;

const publicResourceCacheOptions = {
  next: { revalidate: PUBLIC_RESOURCE_REVALIDATE_SECONDS },
};

export const getExams = async (): Promise<Exam[]> => {
  const token = (await getAuthContext())?.token;
  const path = token ? '/exams' : '/public/exams';
  const res = await serverApi.get<{ data: { exams: Exam[] } }>(
    path,
    token ?? undefined,
  );
  return res.data.exams;
};

export const getPublicExams = async (): Promise<Exam[]> => {
  const res = await serverApi.get<{ data: { exams: Exam[] } }>(
    '/public/exams',
    undefined,
    publicResourceCacheOptions,
  );
  return res.data.exams;
};

export const getPublicExamPaperOverviews = async (
  paperLimit?: number,
): Promise<ExamPaperOverview[]> => {
  const query = paperLimit ? `?paperLimit=${paperLimit}` : '';
  const res = await serverApi.get<{
    data: { overviews: ExamPaperOverview[] };
  }>(
    `/public/exams/paper-overviews${query}`,
    undefined,
    publicResourceCacheOptions,
  );
  return res.data.overviews;
};

export const getCategories = async (): Promise<Category[]> => {
  const token = (await getAuthContext())?.token;
  const path = token ? '/categories' : '/public/categories';
  const res = await serverApi.get<{ data: { categories: Category[] } }>(
    path,
    token ?? undefined,
  );
  return res.data.categories;
};

export const getPublicCategories = async (): Promise<Category[]> => {
  const res = await serverApi.get<{ data: { categories: Category[] } }>(
    '/public/categories',
    undefined,
    publicResourceCacheOptions,
  );
  return res.data.categories;
};
