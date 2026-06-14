import { queryOptions } from '@tanstack/react-query';

import { fetchCategories, fetchExams } from '../api/client/queries';
import { referenceDataKeys } from './keys';

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
