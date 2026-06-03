import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const BookmarkedQuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  imageUrl: z.string().url(),
  paper: z.object({
    id: z.string(),
    title: z.string(),
    year: z.number().int(),
    examName: z.string(),
  }),
  createdAt: IsoDateStringSchema,
});
export type BookmarkedQuestionResponse = z.infer<
  typeof BookmarkedQuestionResponseSchema
>;

export const BookmarkListSummaryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  questionCount: z.number().int(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type BookmarkListSummaryResponse = z.infer<
  typeof BookmarkListSummaryResponseSchema
>;

export const BookmarkListResponseSchema =
  BookmarkListSummaryResponseSchema.extend({
    questions: z.array(BookmarkedQuestionResponseSchema),
  });
export type BookmarkListResponse = z.infer<typeof BookmarkListResponseSchema>;
