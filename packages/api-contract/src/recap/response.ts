import * as z from 'zod';
import {
  RecapTodayStatsResponseSchema,
  RecapWrongReviewResponseSchema,
} from './dto.js';

export const GetRecapSummaryResponseSchema = z.object({
  studyDate: z.iso.date(),
  todayStats: RecapTodayStatsResponseSchema,
  wrongReview: RecapWrongReviewResponseSchema,
});
export type GetRecapSummaryResponse = z.infer<
  typeof GetRecapSummaryResponseSchema
>;
