import * as z from 'zod';
import { StartSolveSessionResponseSchema } from '../solve-sessions/dto.js';
import { DailyWrongQuestionSetResponseSchema } from './schema.js';

export const GetWrongQuestionSetResponseSchema = z.object({
  questionSet: DailyWrongQuestionSetResponseSchema.nullable(),
});
export type GetWrongQuestionSetResponse = z.infer<
  typeof GetWrongQuestionSetResponseSchema
>;

export const CreateWrongQuestionSetRequestSchema = z.object({
  studyDate: z.iso.date().optional(),
});
export type CreateWrongQuestionSetRequest = z.infer<
  typeof CreateWrongQuestionSetRequestSchema
>;

export const CreateWrongQuestionSetResponseSchema = z.object({
  questionSet: DailyWrongQuestionSetResponseSchema,
});
export type CreateWrongQuestionSetResponse = z.infer<
  typeof CreateWrongQuestionSetResponseSchema
>;

export const StartWrongReviewSessionRequestSchema = z.object({
  mode: z.enum(['ONE_BY_ONE', 'EXAM']).optional(),
});
export type StartWrongReviewSessionRequest = z.infer<
  typeof StartWrongReviewSessionRequestSchema
>;

export const StartWrongReviewSessionResponseSchema =
  StartSolveSessionResponseSchema;
export type StartWrongReviewSessionResponse = z.infer<
  typeof StartWrongReviewSessionResponseSchema
>;
