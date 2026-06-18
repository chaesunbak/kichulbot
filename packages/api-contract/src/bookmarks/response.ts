import * as z from 'zod';
import { StartSolveSessionResponseSchema } from '../solve-sessions/response.js';
import {
  BookmarkListResponseSchema,
  BookmarkListSummaryResponseSchema,
  BookmarkedQuestionResponseSchema,
} from './dto.js';

export const ListBookmarkListsResponseSchema = z.object({
  bookmarkLists: z.array(BookmarkListSummaryResponseSchema),
});
export type ListBookmarkListsResponse = z.infer<
  typeof ListBookmarkListsResponseSchema
>;

export const BookmarkListResponseEnvelopeSchema = z.object({
  bookmarkList: BookmarkListResponseSchema,
});
export type BookmarkListResponseEnvelope = z.infer<
  typeof BookmarkListResponseEnvelopeSchema
>;

export const BookmarkListSummaryResponseEnvelopeSchema = z.object({
  bookmarkList: BookmarkListSummaryResponseSchema,
});
export type BookmarkListSummaryResponseEnvelope = z.infer<
  typeof BookmarkListSummaryResponseEnvelopeSchema
>;

export const AddBookmarkedQuestionResponseSchema = z.object({
  question: BookmarkedQuestionResponseSchema,
});
export type AddBookmarkedQuestionResponse = z.infer<
  typeof AddBookmarkedQuestionResponseSchema
>;

export const DeleteBookmarkedQuestionResponseSchema = z.object({
  bookmarkListId: z.string(),
  questionId: z.string(),
});
export type DeleteBookmarkedQuestionResponse = z.infer<
  typeof DeleteBookmarkedQuestionResponseSchema
>;

export const DeleteBookmarkListResponseSchema = z.object({
  id: z.string(),
});
export type DeleteBookmarkListResponse = z.infer<
  typeof DeleteBookmarkListResponseSchema
>;

export const StartBookmarkListSessionResponseSchema =
  StartSolveSessionResponseSchema;
export type StartBookmarkListSessionResponse = z.infer<
  typeof StartBookmarkListSessionResponseSchema
>;
