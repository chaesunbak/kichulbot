import type { Category, Exam, ExamPaperOverview } from '@/features/exams/types';
import { serverApi } from '@/shared/api/server';

export type { Category, Exam, ExamPaperOverview } from '@/features/exams/types';

const PUBLIC_RESOURCE_REVALIDATE_SECONDS = 300;

const publicResourceCacheOptions = {
  next: { revalidate: PUBLIC_RESOURCE_REVALIDATE_SECONDS },
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

export const getPublicCategories = async (): Promise<Category[]> => {
  const res = await serverApi.get<{ data: { categories: Category[] } }>(
    '/public/categories',
    undefined,
    publicResourceCacheOptions,
  );
  return res.data.categories;
};
