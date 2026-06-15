import { queryOptions } from '@tanstack/react-query';

import { fetchAdminTags, fetchTagGroups, fetchTags } from '../api';
import { tagKeys } from './keys';

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
