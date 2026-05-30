import {
  ListExamsResponseSchema,
  ListSubjectsResponseSchema,
} from '@kichulbot/api-contract/taxonomy';
import { apiRequest } from '@/lib/api';

export async function fetchExams(token: string) {
  return apiRequest('/exams', ListExamsResponseSchema.parse, { token });
}

export async function fetchSubjects(token: string) {
  return apiRequest('/subjects', ListSubjectsResponseSchema.parse, { token });
}
