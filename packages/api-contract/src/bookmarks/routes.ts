import {
  AddBookmarkedQuestionResponseSchema,
  BookmarkListResponseEnvelopeSchema,
  BookmarkListSummaryResponseEnvelopeSchema,
  CreateBookmarkListRequestSchema,
  DeleteBookmarkedQuestionResponseSchema,
  ListBookmarkListsResponseSchema,
  StartBookmarkListSessionRequestSchema,
  StartBookmarkListSessionResponseSchema,
} from './dto.js';

export const bookmarkRoutes = {
  listBookmarkLists: {
    method: 'GET',
    path: '/me/question-lists',
    request: null,
    response: ListBookmarkListsResponseSchema,
  },
  createBookmarkList: {
    method: 'POST',
    path: '/me/question-lists',
    request: CreateBookmarkListRequestSchema,
    response: BookmarkListSummaryResponseEnvelopeSchema,
  },
  getBookmarkList: {
    method: 'GET',
    path: '/me/question-lists/:bookmarkListId',
    request: null,
    response: BookmarkListResponseEnvelopeSchema,
  },
  startSolveSession: {
    method: 'POST',
    path: '/me/question-lists/:bookmarkListId/solve-sessions',
    request: StartBookmarkListSessionRequestSchema,
    response: StartBookmarkListSessionResponseSchema,
  },
  addBookmarkedQuestion: {
    method: 'PUT',
    path: '/me/question-lists/:bookmarkListId/questions/:questionId',
    request: null,
    response: AddBookmarkedQuestionResponseSchema,
  },
  deleteBookmarkedQuestion: {
    method: 'DELETE',
    path: '/me/question-lists/:bookmarkListId/questions/:questionId',
    request: null,
    response: DeleteBookmarkedQuestionResponseSchema,
  },
} as const;
