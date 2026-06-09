import {
  CreatePaperRequestSchema,
  CreatePaperResponseSchema,
  CreatePaperImportJobResponseSchema,
  CreatePaperImportJobRequestSchema,
  DeletePaperResponseSchema,
  ListPapersResponseSchema,
  ListPapersQuerySchema,
  GetPaperResponseSchema,
  ListPaperQuestionsResponseSchema,
  ListPaperImportJobsResponseSchema,
  PaperImportJobResponseSchema,
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
    request: CreatePaperImportJobRequestSchema,
    response: CreatePaperImportJobResponseSchema,
  },
  listPaperImportDrafts: {
    method: 'GET',
    path: '/paper-import-drafts',
    request: null,
    response: ListPaperImportJobsResponseSchema,
  },
  getPaperImportDraft: {
    method: 'GET',
    path: '/paper-import-drafts/:id',
    request: null,
    response: PaperImportJobResponseSchema,
  },
  getPaper: {
    method: 'GET',
    path: '/exam-papers/:id',
    request: null,
    response: GetPaperResponseSchema,
  },
  listPaperQuestions: {
    method: 'GET',
    path: '/exam-papers/:id/questions',
    request: null,
    response: ListPaperQuestionsResponseSchema,
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
