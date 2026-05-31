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
    path: '/library/bookshelves',
    request: null,
    response: ListBookshelvesResponseSchema,
  },
  createBookshelf: {
    method: 'POST',
    path: '/library/bookshelves',
    request: CreateBookshelfRequestSchema,
    response: BookshelfResponseEnvelopeSchema,
  },
  updateBookshelf: {
    method: 'PATCH',
    path: '/library/bookshelves/:bookshelfId',
    request: UpdateBookshelfRequestSchema,
    response: BookshelfResponseEnvelopeSchema,
  },
  deleteBookshelf: {
    method: 'DELETE',
    path: '/library/bookshelves/:bookshelfId',
    request: null,
    response: DeleteBookshelfResponseSchema,
  },
  addLibraryPaper: {
    method: 'POST',
    path: '/library/bookshelves/:bookshelfId/papers/:paperId',
    request: null,
    response: AddLibraryPaperResponseSchema,
  },
  deleteLibraryPaper: {
    method: 'DELETE',
    path: '/library/bookshelves/:bookshelfId/papers/:paperId',
    request: null,
    response: DeleteLibraryPaperResponseSchema,
  },
} as const;
