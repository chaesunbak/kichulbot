import { ListPaperImportJobsResponseSchema } from '@kichulbot/api-contract/papers';

import { apiRequest } from '@/shared/api/api-client';

import {
  adminGetPaperResponseSchema,
  adminListPapersResponseSchema,
} from '../../schemas';

export async function fetchPapers(token: string) {
  return apiRequest('/exam-papers', adminListPapersResponseSchema.parse, {
    token,
  });
}

export async function fetchPaper(token: string, paperId: string) {
  return apiRequest(
    `/exam-papers/${paperId}`,
    adminGetPaperResponseSchema.parse,
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
