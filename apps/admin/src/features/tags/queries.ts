import { queryOptions } from '@tanstack/react-query';

import { fetchAdminTags, fetchTagGroups, fetchTags } from './api';

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (examId?: string) => [...tagKeys.lists(), { examId }] as const,
  adminList: () => [...tagKeys.all, 'admin-list'] as const,
  groupLists: () => [...tagKeys.all, 'group-list'] as const,
  groupList: (examId?: string) =>
    [...tagKeys.groupLists(), { examId }] as const,
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

export function tagGroupsQueryOptions(token: string, examId?: string) {
  return queryOptions({
    queryKey: tagKeys.groupList(examId),
    queryFn: () => fetchTagGroups(token, examId),
  });
}
