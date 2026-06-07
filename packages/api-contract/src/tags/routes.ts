import {
  CreateTagRequestSchema,
  CreateTagGroupRequestSchema,
  DeleteTagResponseSchema,
  DeleteTagGroupResponseSchema,
  ListTagGroupsResponseSchema,
  ListTagsResponseSchema,
  TagMutationResponseSchema,
  TagGroupMutationResponseSchema,
  UpdateTagGroupRequestSchema,
  UpdateTagRequestSchema,
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
  createTag: {
    method: 'POST',
    path: '/tags',
    request: CreateTagRequestSchema,
    response: TagMutationResponseSchema,
  },
  updateTag: {
    method: 'PATCH',
    path: '/tags/:id',
    request: UpdateTagRequestSchema,
    response: TagMutationResponseSchema,
  },
  deleteTag: {
    method: 'DELETE',
    path: '/tags/:id',
    request: null,
    response: DeleteTagResponseSchema,
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
