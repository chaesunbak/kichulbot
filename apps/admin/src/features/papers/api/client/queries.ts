import {
  AdminPaperResponseSchema,
  ListPaperImportJobsResponseSchema,
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

export async function fetchPaperImportDraftJobs(token: string) {
  return apiRequest(
    '/paper-import-drafts',
    ListPaperImportJobsResponseSchema.parse,
    { token },
  );
}
