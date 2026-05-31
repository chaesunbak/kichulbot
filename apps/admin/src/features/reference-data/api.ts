import {
  ListExamsResponseSchema,
  ListSubjectsResponseSchema,
} from '@kichulbot/api-contract/taxonomy';
import { apiRequest } from '@/shared/api/api-client';

export async function fetchExams(token: string) {
  return apiRequest('/exams', ListExamsResponseSchema.parse, { token });
}

export async function fetchSubjects(token: string) {
  return apiRequest('/subjects', ListSubjectsResponseSchema.parse, { token });
}
