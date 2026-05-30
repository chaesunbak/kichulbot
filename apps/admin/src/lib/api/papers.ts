import * as z from 'zod';
import {
  AdminPaperResponseSchema,
  CreatePaperResponseSchema,
} from '@kichulbot/api-contract/papers';
import { apiRequest } from '@/lib/api';

const AdminListPapersResponseSchema = z.object({
  papers: z.array(AdminPaperResponseSchema),
});

export async function fetchPapers(token: string) {
  return apiRequest('/papers', AdminListPapersResponseSchema.parse, { token });
}

export interface CreatePaperInput {
  title: string;
  year: number;
  examId: string;
  subjectId: string;
  questionCount: number;
  isPublished: boolean;
}

export async function createPaper(token: string, input: CreatePaperInput) {
  return apiRequest('/papers', CreatePaperResponseSchema.parse, {
    method: 'POST',
    token,
    body: input,
  });
}
