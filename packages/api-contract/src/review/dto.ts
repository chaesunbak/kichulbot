import * as z from 'zod';
import { StartAnswerSessionResponseSchema } from '../answer-sessions/dto.js';
import { DailyWrongQuestionSetResponseSchema } from './schema.js';

export const GetTodayWrongQuestionsResponseSchema = z.object({
  questionSet: DailyWrongQuestionSetResponseSchema,
});
export type GetTodayWrongQuestionsResponse = z.infer<
  typeof GetTodayWrongQuestionsResponseSchema
>;

export const RefreshTodayWrongQuestionSetResponseSchema =
  GetTodayWrongQuestionsResponseSchema;
export type RefreshTodayWrongQuestionSetResponse = z.infer<
  typeof RefreshTodayWrongQuestionSetResponseSchema
>;

export const StartWrongReviewSessionRequestSchema = z.object({
  mode: z.enum(['ONE_BY_ONE', 'EXAM']).optional(),
});
export type StartWrongReviewSessionRequest = z.infer<
  typeof StartWrongReviewSessionRequestSchema
>;

export const StartWrongReviewSessionResponseSchema =
  StartAnswerSessionResponseSchema;
export type StartWrongReviewSessionResponse = z.infer<
  typeof StartWrongReviewSessionResponseSchema
>;
