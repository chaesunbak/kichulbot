import {
  CreateOfficialTagRequestSchema,
  CreateTagGroupRequestSchema,
  DeleteTagGroupResponseSchema,
  DeleteOfficialTagResponseSchema,
  ListTagGroupsResponseSchema,
  ListTagsResponseSchema,
  OfficialTagMutationResponseSchema,
  TagGroupMutationResponseSchema,
  UpdateTagGroupRequestSchema,
  UpdateOfficialTagRequestSchema,
} from './dto.js';

export const tagsRoutes = {
  listTags: {
    method: 'GET',
    path: '/tags',
    request: null,
    response: ListTagsResponseSchema,
  },
  listAdminTags: {
    method: 'GET',
    path: '/tags',
    request: null,
    response: ListTagsResponseSchema,
  },
  createOfficialTag: {
    method: 'POST',
    path: '/tags',
    request: CreateOfficialTagRequestSchema,
    response: OfficialTagMutationResponseSchema,
  },
  updateOfficialTag: {
    method: 'PATCH',
    path: '/tags/:id',
    request: UpdateOfficialTagRequestSchema,
    response: OfficialTagMutationResponseSchema,
  },
  deleteOfficialTag: {
    method: 'DELETE',
    path: '/tags/:id',
    request: null,
    response: DeleteOfficialTagResponseSchema,
  },
  listTagGroups: {
    method: 'GET',
    path: '/tag-groups',
    request: null,
    response: ListTagGroupsResponseSchema,
  },
  createTagGroup: {
    method: 'POST',
    path: '/tag-groups',
    request: CreateTagGroupRequestSchema,
    response: TagGroupMutationResponseSchema,
  },
  updateTagGroup: {
    method: 'PATCH',
    path: '/tag-groups/:id',
    request: UpdateTagGroupRequestSchema,
    response: TagGroupMutationResponseSchema,
  },
  deleteTagGroup: {
    method: 'DELETE',
    path: '/tag-groups/:id',
    request: null,
    response: DeleteTagGroupResponseSchema,
  },
} as const;
