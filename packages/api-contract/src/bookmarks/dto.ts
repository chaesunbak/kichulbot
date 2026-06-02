import * as z from 'zod';
import { StartSolveSessionResponseSchema } from '../solve-sessions/dto.js';
import {
  BookmarkListResponseSchema,
  BookmarkListSummaryResponseSchema,
  BookmarkedQuestionResponseSchema,
} from './schema.js';

export const CreateBookmarkListRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export type CreateBookmarkListRequest = z.infer<
  typeof CreateBookmarkListRequestSchema
>;

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

export const StartBookmarkListSessionRequestSchema = z.object({
  mode: z.enum(['ONE_BY_ONE', 'EXAM']),
});
export type StartBookmarkListSessionRequest = z.infer<
  typeof StartBookmarkListSessionRequestSchema
>;

export const StartBookmarkListSessionResponseSchema =
  StartSolveSessionResponseSchema;
export type StartBookmarkListSessionResponse = z.infer<
  typeof StartBookmarkListSessionResponseSchema
>;
