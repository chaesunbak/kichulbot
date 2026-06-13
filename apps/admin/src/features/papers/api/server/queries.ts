import { queryOptions } from '@tanstack/react-query';

import {
  fetchPaper,
  fetchPaperImportDraftJobs,
  fetchPapers,
} from '../client/queries';

export const paperKeys = {
  all: ['papers'] as const,
  lists: () => [...paperKeys.all, 'list'] as const,
  list: () => [...paperKeys.lists()] as const,
  importJobs: () => [...paperKeys.all, 'import-jobs'] as const,
  details: () => [...paperKeys.all, 'detail'] as const,
  detail: (paperId: string) => [...paperKeys.details(), paperId] as const,
};

export function papersQueryOptions(token: string) {
  return queryOptions({
    queryKey: paperKeys.list(),
    queryFn: () => fetchPapers(token),
  });
}

export function paperImportJobsQueryOptions(token: string) {
  return queryOptions({
    queryKey: paperKeys.importJobs(),
    queryFn: () => fetchPaperImportDraftJobs(token),
  });
}

export function paperQueryOptions(token: string, paperId: string) {
  return queryOptions({
    queryKey: paperKeys.detail(paperId),
    queryFn: () => fetchPaper(token, paperId),
  });
}
