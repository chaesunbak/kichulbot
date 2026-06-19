import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const RecapTodayStatsResponseSchema = z.object({
  accuracyRate: z.number().int().min(0).max(100),
  correctCount: z.number().int().nonnegative(),
  incorrectCount: z.number().int().nonnegative(),
  omittedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
});
export type RecapTodayStatsResponse = z.infer<
  typeof RecapTodayStatsResponseSchema
>;

export const RecapWrongReviewResponseSchema = z.object({
  questionSetId: z.string().nullable(),
  questionCount: z.number().int().nonnegative(),
  generatedAt: IsoDateStringSchema.nullable(),
});
export type RecapWrongReviewResponse = z.infer<
  typeof RecapWrongReviewResponseSchema
>;
