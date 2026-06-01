import { queryOptions } from '@tanstack/react-query';

import { fetchAdminTags, fetchTags } from './api';

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (examId?: string) => [...tagKeys.lists(), { examId }] as const,
  adminList: () => [...tagKeys.all, 'admin-list'] as const,
};

export function tagsQueryOptions(token: string, examId?: string) {
  return queryOptions({
    queryKey: tagKeys.list(examId),
    queryFn: () => fetchTags(token, examId),
  });
}

export function adminTagsQueryOptions(token: string) {
  return queryOptions({
    queryKey: tagKeys.adminList(),
    queryFn: () => fetchAdminTags(token),
  });
}
