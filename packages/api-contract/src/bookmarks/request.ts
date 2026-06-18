import * as z from 'zod';
import { StartSolveSessionResponseSchema } from '../solve-sessions/response.js';
import {
  BookmarkListResponseSchema,
  BookmarkListSummaryResponseSchema,
  BookmarkedQuestionResponseSchema,
} from './dto.js';

export const CreateBookmarkListRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
});
export type CreateBookmarkListRequest = z.infer<
  typeof CreateBookmarkListRequestSchema
>;

export const StartBookmarkListSessionRequestSchema = z.strictObject({
  mode: z.enum(['ONE_BY_ONE', 'EXAM']),
});
export type StartBookmarkListSessionRequest = z.infer<
  typeof StartBookmarkListSessionRequestSchema
>;
