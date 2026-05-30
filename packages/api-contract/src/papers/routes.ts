import {
  CreatePaperRequestSchema,
  CreatePaperResponseSchema,
  ListPapersResponseSchema,
  GetPaperResponseSchema,
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
} as const;
