import type {
  CreateOfficialTagRequest,
  CreateTagGroupRequest,
  UpdateOfficialTagRequest,
  UpdateTagGroupRequest,
} from '@kichulbot/api-contract/tags';
import {
  DeleteOfficialTagResponseSchema,
  DeleteTagGroupResponseSchema,
  ListTagGroupsResponseSchema,
  ListTagsResponseSchema,
  OfficialTagMutationResponseSchema,
  TagGroupMutationResponseSchema,
} from '@kichulbot/api-contract/tags';

import { apiRequest } from '@/shared/api/api-client';

export async function fetchTags(token: string, examId?: string) {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return apiRequest(`/tags${query}`, ListTagsResponseSchema.parse, { token });
}

export async function fetchAdminTags(token: string) {
  return apiRequest('/tags', ListTagsResponseSchema.parse, { token });
}

export async function createOfficialTag(
  token: string,
  input: CreateOfficialTagRequest,
) {
  return apiRequest('/tags', OfficialTagMutationResponseSchema.parse, {
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
  return apiRequest(`/tags/${tagId}`, OfficialTagMutationResponseSchema.parse, {
    token,
    method: 'PATCH',
    body: input,
  });
}

export async function deleteOfficialTag(token: string, tagId: string) {
  return apiRequest(`/tags/${tagId}`, DeleteOfficialTagResponseSchema.parse, {
    token,
    method: 'DELETE',
  });
}

export async function fetchTagGroups(token: string, examId?: string) {
  const query = examId ? `?examId=${encodeURIComponent(examId)}` : '';
  return apiRequest(`/tag-groups${query}`, ListTagGroupsResponseSchema.parse, {
    token,
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
