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
    path: '/admin/tags',
    request: null,
    response: ListTagsResponseSchema,
  },
  listAdminTags: {
    method: 'GET',
    path: '/admin/tags',
    request: null,
    response: ListTagsResponseSchema,
  },
  createTag: {
    method: 'POST',
    path: '/admin/tags',
    request: CreateTagRequestSchema,
    response: TagMutationResponseSchema,
  },
  updateTag: {
    method: 'PATCH',
    path: '/admin/tags/:id',
    request: UpdateTagRequestSchema,
    response: TagMutationResponseSchema,
  },
  deleteTag: {
    method: 'DELETE',
    path: '/admin/tags/:id',
    request: null,
    response: DeleteTagResponseSchema,
  },
  listTagGroups: {
    method: 'GET',
    path: '/admin/tag-groups',
    request: null,
    response: ListTagGroupsResponseSchema,
  },
  createTagGroup: {
    method: 'POST',
    path: '/admin/tag-groups',
    request: CreateTagGroupRequestSchema,
    response: TagGroupMutationResponseSchema,
  },
  updateTagGroup: {
    method: 'PATCH',
    path: '/admin/tag-groups/:id',
    request: UpdateTagGroupRequestSchema,
    response: TagGroupMutationResponseSchema,
  },
  deleteTagGroup: {
    method: 'DELETE',
    path: '/admin/tag-groups/:id',
    request: null,
    response: DeleteTagGroupResponseSchema,
  },
} as const;
