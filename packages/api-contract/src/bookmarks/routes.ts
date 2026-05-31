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
    path: '/bookmark-lists',
    request: null,
    response: ListBookmarkListsResponseSchema,
  },
  createBookmarkList: {
    method: 'POST',
    path: '/bookmark-lists',
    request: CreateBookmarkListRequestSchema,
    response: BookmarkListSummaryResponseEnvelopeSchema,
  },
  getBookmarkList: {
    method: 'GET',
    path: '/bookmark-lists/:bookmarkListId',
    request: null,
    response: BookmarkListResponseEnvelopeSchema,
  },
  addBookmarkedQuestion: {
    method: 'POST',
    path: '/bookmark-lists/:bookmarkListId/questions/:questionId',
    request: null,
    response: AddBookmarkedQuestionResponseSchema,
  },
  deleteBookmarkedQuestion: {
    method: 'DELETE',
    path: '/bookmark-lists/:bookmarkListId/questions/:questionId',
    request: null,
    response: DeleteBookmarkedQuestionResponseSchema,
  },
} as const;
