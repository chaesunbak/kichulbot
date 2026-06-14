import { apiRequest } from '@/shared/api/api-client';

import {
  adminListCategoriesResponseSchema,
  adminListExamsResponseSchema,
} from '../../schemas';

export async function fetchExams(token: string) {
  return apiRequest('/exams', adminListExamsResponseSchema.parse, { token });
}

export async function fetchCategories(token: string) {
  return apiRequest('/categories', adminListCategoriesResponseSchema.parse, {
    token,
  });
}
