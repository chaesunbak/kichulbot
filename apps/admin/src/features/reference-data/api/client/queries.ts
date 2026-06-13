import {
  ListCategoriesResponseSchema,
  ListExamsResponseSchema,
} from '@kichulbot/api-contract/taxonomy';

import { apiRequest } from '@/shared/api/api-client';

export async function fetchExams(token: string) {
  return apiRequest('/exams', ListExamsResponseSchema.parse, { token });
}

export async function fetchCategories(token: string) {
  return apiRequest('/categories', ListCategoriesResponseSchema.parse, {
    token,
  });
}
