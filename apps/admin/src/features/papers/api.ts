import {
  AdminPaperResponseSchema,
  CreatePaperResponseSchema,
  type CreatePaperWithQuestionsRequest,
  DeletePaperResponseSchema,
  PaperImportDraftResponseSchema,
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

export interface CreatePaperImportDraftInput {
  questionPdf: File;
  answerPdf: File;
  layout: string;
  variant: string;
}

export async function createPaperImportDraft(
  token: string,
  input: CreatePaperImportDraftInput,
) {
  const formData = new FormData();
  formData.append('questionPdf', input.questionPdf);
  formData.append('answerPdf', input.answerPdf);
  formData.append('layout', input.layout);
  formData.append('variant', input.variant);

  return apiRequest(
    '/paper-import-drafts',
    PaperImportDraftResponseSchema.parse,
    {
      method: 'POST',
      token,
      body: formData,
    },
  );
}

export async function createPaperWithQuestions(
  token: string,
  payload: CreatePaperWithQuestionsRequest,
  images: File[],
) {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  images.forEach((image) => formData.append('images', image, image.name));

  return apiRequest('/exam-papers', CreatePaperResponseSchema.parse, {
    method: 'POST',
    token,
    body: formData,
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
