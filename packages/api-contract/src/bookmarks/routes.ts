import {
  AddBookmarkedQuestionResponseSchema,
  BookmarkListResponseEnvelopeSchema,
  BookmarkListSummaryResponseEnvelopeSchema,
  CreateBookmarkListRequestSchema,
  DeleteBookmarkedQuestionResponseSchema,
  ListBookmarkListsResponseSchema,
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
