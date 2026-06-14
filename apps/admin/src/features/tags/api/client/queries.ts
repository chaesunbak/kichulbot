import { ListTagGroupsResponseSchema } from '@kichulbot/api-contract/tags';

import { apiRequest } from '@/shared/api/api-client';

import { adminListTagsResponseSchema } from '../../schemas';

export async function fetchTags(token: string, examId?: string) {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return apiRequest(`/tags${query}`, adminListTagsResponseSchema.parse, {
    token,
  });
}

export async function fetchAdminTags(token: string) {
  return apiRequest('/tags', adminListTagsResponseSchema.parse, { token });
}

export async function fetchTagGroups(token: string, examId?: string) {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return apiRequest(`/tag-groups${query}`, ListTagGroupsResponseSchema.parse, {
    token,
  });
}
