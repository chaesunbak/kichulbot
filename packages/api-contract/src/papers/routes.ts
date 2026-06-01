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
    path: '/exam-papers',
    request: null,
    response: ListPapersResponseSchema,
  },
  createPaper: {
    method: 'POST',
    path: '/exam-papers',
    request: CreatePaperRequestSchema,
    response: CreatePaperResponseSchema,
  },
  getPaper: {
    method: 'GET',
    path: '/exam-papers/:id',
    request: null,
    response: GetPaperResponseSchema,
  },
  updatePaper: {
    method: 'PATCH',
    path: '/exam-papers/:id',
    request: UpdatePaperRequestSchema,
    response: UpdatePaperResponseSchema,
  },
  deletePaper: {
    method: 'DELETE',
    path: '/exam-papers/:id',
    request: null,
    response: DeletePaperResponseSchema,
  },
} as const;
