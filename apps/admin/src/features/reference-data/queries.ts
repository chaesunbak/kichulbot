import { queryOptions } from '@tanstack/react-query';
import { fetchExams, fetchSubjects } from './api';

export const referenceDataKeys = {
  all: ['reference-data'] as const,
  exams: () => [...referenceDataKeys.all, 'exams'] as const,
  subjects: () => [...referenceDataKeys.all, 'subjects'] as const,
};

export function examsQueryOptions(token: string) {
  return queryOptions({
    queryKey: referenceDataKeys.exams(),
    queryFn: () => fetchExams(token),
  });
}

export function subjectsQueryOptions(token: string) {
  return queryOptions({
    queryKey: referenceDataKeys.subjects(),
    queryFn: () => fetchSubjects(token),
  });
}
