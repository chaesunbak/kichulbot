import { queryOptions } from '@tanstack/react-query';

import { fetchPaper, fetchPaperImportDraftJobs, fetchPapers } from '../api';
import { paperKeys } from './keys';

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
