import {
  AdminPaperResponseSchema,
  CreatePaperImportJobResponseSchema,
  CreatePaperResponseSchema,
  type CreatePaperWithQuestionsRequest,
  DeletePaperResponseSchema,
  PaperImportDraftResponseSchema,
  PaperImportJobResponseSchema,
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
    CreatePaperImportJobResponseSchema.parse,
    {
      method: 'POST',
      token,
      body: formData,
    },
  );
}

export async function fetchPaperImportDraftJob(token: string, jobId: string) {
  return apiRequest(
    `/paper-import-drafts/${jobId}`,
    PaperImportJobResponseSchema.parse,
    { token },
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForPaperImportDraft(
  token: string,
  jobId: string,
  options = { intervalMs: 2_000, timeoutMs: 300_000 },
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < options.timeoutMs) {
    const response = await fetchPaperImportDraftJob(token, jobId);
    const { job } = response;

    if (job.status === 'COMPLETED' && job.result) {
      return PaperImportDraftResponseSchema.parse(job.result);
    }
    if (job.status === 'FAILED') {
      throw new Error(job.errorMessage ?? 'PDF 추출에 실패했습니다.');
    }

    await sleep(options.intervalMs);
  }

  throw new Error('PDF 추출 시간이 초과되었습니다.');
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
