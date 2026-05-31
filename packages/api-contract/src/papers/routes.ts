import {
  CreatePaperRequestSchema,
  CreatePaperResponseSchema,
  DeletePaperResponseSchema,
  ListPapersResponseSchema,
  GetPaperResponseSchema,
  UpdatePaperRequestSchema,
  UpdatePaperResponseSchema,
} from './dto.js';

export const papersRoutes = {
  listPapers: {
    method: 'GET',
    path: '/papers',
    request: null,
    response: ListPapersResponseSchema,
  },
  createPaper: {
    method: 'POST',
    path: '/papers',
    request: CreatePaperRequestSchema,
    response: CreatePaperResponseSchema,
  },
  getPaper: {
    method: 'GET',
    path: '/papers/:id',
    request: null,
    response: GetPaperResponseSchema,
  },
  updatePaper: {
    method: 'PATCH',
    path: '/papers/:id',
    request: UpdatePaperRequestSchema,
    response: UpdatePaperResponseSchema,
  },
  deletePaper: {
    method: 'DELETE',
    path: '/papers/:id',
    request: null,
    response: DeletePaperResponseSchema,
  },
} as const;
