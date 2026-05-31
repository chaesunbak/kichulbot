import { queryOptions } from '@tanstack/react-query';
import { fetchAdminTags, fetchTags } from './api';

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (subjectId?: string) => [...tagKeys.lists(), { subjectId }] as const,
  adminList: () => [...tagKeys.all, 'admin-list'] as const,
};

export function tagsQueryOptions(token: string, subjectId?: string) {
  return queryOptions({
    queryKey: tagKeys.list(subjectId),
    queryFn: () => fetchTags(token, subjectId),
  });
}

export function adminTagsQueryOptions(token: string) {
  return queryOptions({
    queryKey: tagKeys.adminList(),
    queryFn: () => fetchAdminTags(token),
  });
}
