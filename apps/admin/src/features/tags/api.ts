import {
  CreateOfficialTagRequest,
  ListTagsResponseSchema,
  OfficialTagMutationResponseSchema,
  UpdateOfficialTagRequest,
} from '@kichulbot/api-contract/tags';
import { apiRequest } from '@/shared/api/api-client';

export async function fetchTags(token: string, subjectId?: string) {
  const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
  return apiRequest(`/tags${query}`, ListTagsResponseSchema.parse, { token });
}

export async function fetchAdminTags(token: string) {
  return apiRequest('/admin/tags', ListTagsResponseSchema.parse, { token });
}

export async function createOfficialTag(
  token: string,
  input: CreateOfficialTagRequest,
) {
  return apiRequest('/admin/tags', OfficialTagMutationResponseSchema.parse, {
    token,
    method: 'POST',
    body: input,
  });
}

export async function updateOfficialTag(
  token: string,
  tagId: string,
  input: UpdateOfficialTagRequest,
) {
  return apiRequest(
    `/admin/tags/${tagId}`,
    OfficialTagMutationResponseSchema.parse,
    {
      token,
      method: 'PATCH',
      body: input,
    },
  );
}
