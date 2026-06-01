import { queryOptions } from '@tanstack/react-query';

import { fetchCategories, fetchExams } from './api';

export const referenceDataKeys = {
  all: ['reference-data'] as const,
  exams: () => [...referenceDataKeys.all, 'exams'] as const,
  categories: () => [...referenceDataKeys.all, 'categories'] as const,
};

export function examsQueryOptions(token: string) {
  return queryOptions({
    queryKey: referenceDataKeys.exams(),
    queryFn: () => fetchExams(token),
  });
}

export function categoriesQueryOptions(token: string) {
  return queryOptions({
    queryKey: referenceDataKeys.categories(),
    queryFn: () => fetchCategories(token),
  });
}
