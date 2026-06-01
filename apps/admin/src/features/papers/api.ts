import {
  AdminPaperResponseSchema,
  CreatePaperResponseSchema,
  DeletePaperResponseSchema,
  UpdatePaperResponseSchema,
} from '@kichulbot/api-contract/papers';
import * as z from 'zod';

import { apiRequest } from '@/shared/api/api-client';

const AdminListPapersResponseSchema = z.object({
  papers: z.array(AdminPaperResponseSchema),
});

export async function fetchPapers(token: string) {
  return apiRequest('/exam-papers', AdminListPapersResponseSchema.parse, {
    token,
  });
}

const AdminGetPaperResponseSchema = z.object({
  paper: AdminPaperResponseSchema,
});

export async function fetchPaper(token: string, paperId: string) {
  return apiRequest(
    `/exam-papers/${paperId}`,
    AdminGetPaperResponseSchema.parse,
    { token },
  );
}

export interface CreatePaperInput {
  title: string;
  year: number;
  month?: number;
  grade?: number;
  round?: number;
  examId: string;
  questionCount: number;
  isPublished: boolean;
}

export async function createPaper(token: string, input: CreatePaperInput) {
  return apiRequest('/exam-papers', CreatePaperResponseSchema.parse, {
    method: 'POST',
    token,
    body: input,
  });
}

export async function updatePaperPublished(
  token: string,
  paperId: string,
  isPublished: boolean,
) {
  return apiRequest(
    `/exam-papers/${paperId}`,
    UpdatePaperResponseSchema.parse,
    {
      method: 'PATCH',
      token,
      body: { isPublished },
    },
  );
}

export async function deletePaper(token: string, paperId: string) {
  return apiRequest(
    `/exam-papers/${paperId}`,
    DeletePaperResponseSchema.parse,
    {
      method: 'DELETE',
      token,
    },
  );
}
