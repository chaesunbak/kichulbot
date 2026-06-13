import {
  ListTagGroupsResponseSchema,
  ListTagsResponseSchema,
} from '@kichulbot/api-contract/tags';

import { apiRequest } from '@/shared/api/api-client';

export async function fetchTags(token: string, examId?: string) {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return apiRequest(`/tags${query}`, ListTagsResponseSchema.parse, { token });
}

export async function fetchAdminTags(token: string) {
  return apiRequest('/tags', ListTagsResponseSchema.parse, { token });
}

export async function fetchTagGroups(token: string, examId?: string) {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return apiRequest(`/tag-groups${query}`, ListTagGroupsResponseSchema.parse, {
    token,
  });
}
