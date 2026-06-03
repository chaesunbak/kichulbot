import {
  CreatePaperRequestSchema,
  CreatePaperResponseSchema,
  DeletePaperResponseSchema,
  ListPapersResponseSchema,
  ListPapersQuerySchema,
  GetPaperResponseSchema,
  PaperImportDraftResponseSchema,
  UpdatePaperRequestSchema,
  UpdatePaperResponseSchema,
} from './dto.js';

export const papersRoutes = {
  listPapers: {
    method: 'GET',
    path: '/exam-papers',
    request: ListPapersQuerySchema,
    response: ListPapersResponseSchema,
  },
  createPaper: {
    method: 'POST',
    path: '/exam-papers',
    request: CreatePaperRequestSchema,
    response: CreatePaperResponseSchema,
  },
  createPaperImportDraft: {
    method: 'POST',
    path: '/paper-import-drafts',
    request: null,
    response: PaperImportDraftResponseSchema,
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
