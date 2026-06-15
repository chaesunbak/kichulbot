import {
  type CreateTagGroupRequest,
  type CreateTagRequest,
  DeleteTagGroupResponseSchema,
  DeleteTagResponseSchema,
  ListTagGroupsResponseSchema,
  TagGroupMutationResponseSchema,
  TagMutationResponseSchema,
  type UpdateTagGroupRequest,
  type UpdateTagRequest,
} from '@kichulbot/api-contract/tags';

import { apiRequest } from '@/shared/api/api-client';

import { adminListTagsResponseSchema } from './schemas';

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

export async function createTag(token: string, input: CreateTagRequest) {
  return apiRequest('/tags', TagMutationResponseSchema.parse, {
    token,
    method: 'POST',
    body: input,
  });
}

export async function updateTag(
  token: string,
  tagId: string,
  input: UpdateTagRequest,
) {
  return apiRequest(`/tags/${tagId}`, TagMutationResponseSchema.parse, {
    token,
    method: 'PATCH',
    body: input,
  });
}

export async function deleteTag(token: string, tagId: string) {
  return apiRequest(`/tags/${tagId}`, DeleteTagResponseSchema.parse, {
    token,
    method: 'DELETE',
  });
}

export async function createTagGroup(
  token: string,
  input: CreateTagGroupRequest,
) {
  return apiRequest('/tag-groups', TagGroupMutationResponseSchema.parse, {
    token,
    method: 'POST',
    body: input,
  });
}

export async function updateTagGroup(
  token: string,
  tagGroupId: string,
  input: UpdateTagGroupRequest,
) {
  return apiRequest(
    `/tag-groups/${tagGroupId}`,
    TagGroupMutationResponseSchema.parse,
    {
      token,
      method: 'PATCH',
      body: input,
    },
  );
}

export async function deleteTagGroup(token: string, tagGroupId: string) {
  return apiRequest(
    `/tag-groups/${tagGroupId}`,
    DeleteTagGroupResponseSchema.parse,
    {
      token,
      method: 'DELETE',
    },
  );
}
