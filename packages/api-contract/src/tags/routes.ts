import {
  CreateOfficialTagRequestSchema,
  ListTagsResponseSchema,
  OfficialTagMutationResponseSchema,
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
    path: '/admin/tags',
    request: null,
    response: ListTagsResponseSchema,
  },
  createOfficialTag: {
    method: 'POST',
    path: '/admin/tags',
    request: CreateOfficialTagRequestSchema,
    response: OfficialTagMutationResponseSchema,
  },
  updateOfficialTag: {
    method: 'PATCH',
    path: '/admin/tags/:id',
    request: UpdateOfficialTagRequestSchema,
    response: OfficialTagMutationResponseSchema,
  },
} as const;
