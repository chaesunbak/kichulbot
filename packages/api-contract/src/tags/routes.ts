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
    path: '/tags?includeInactive=true',
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
} as const;
