import {
  AddLibraryPaperResponseSchema,
  BookshelfResponseEnvelopeSchema,
  CreateBookshelfRequestSchema,
  DeleteBookshelfResponseSchema,
  DeleteLibraryPaperResponseSchema,
  ListBookshelvesResponseSchema,
  UpdateBookshelfRequestSchema,
} from './dto.js';

export const libraryRoutes = {
  listBookshelves: {
    method: 'GET',
    path: '/me/paper-lists',
    request: null,
    response: ListBookshelvesResponseSchema,
  },
  createBookshelf: {
    method: 'POST',
    path: '/me/paper-lists',
    request: CreateBookshelfRequestSchema,
    response: BookshelfResponseEnvelopeSchema,
  },
  updateBookshelf: {
    method: 'PATCH',
    path: '/me/paper-lists/:bookshelfId',
    request: UpdateBookshelfRequestSchema,
    response: BookshelfResponseEnvelopeSchema,
  },
  deleteBookshelf: {
    method: 'DELETE',
    path: '/me/paper-lists/:bookshelfId',
    request: null,
    response: DeleteBookshelfResponseSchema,
  },
  addLibraryPaper: {
    method: 'PUT',
    path: '/me/paper-lists/:bookshelfId/exam-papers/:paperId',
    request: null,
    response: AddLibraryPaperResponseSchema,
  },
  deleteLibraryPaper: {
    method: 'DELETE',
    path: '/me/paper-lists/:bookshelfId/exam-papers/:paperId',
    request: null,
    response: DeleteLibraryPaperResponseSchema,
  },
} as const;
