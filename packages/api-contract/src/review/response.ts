import * as z from 'zod';
import { StartSolveSessionResponseSchema } from '../solve-sessions/response.js';
import { DailyWrongQuestionSetResponseSchema } from './dto.js';

export const GetWrongQuestionSetResponseSchema = z.object({
  questionSet: DailyWrongQuestionSetResponseSchema.nullable(),
});
export type GetWrongQuestionSetResponse = z.infer<
  typeof GetWrongQuestionSetResponseSchema
>;

export const CreateWrongQuestionSetResponseSchema = z.object({
  questionSet: DailyWrongQuestionSetResponseSchema,
});
export type CreateWrongQuestionSetResponse = z.infer<
  typeof CreateWrongQuestionSetResponseSchema
>;

export const StartWrongReviewSessionResponseSchema =
  StartSolveSessionResponseSchema;
export type StartWrongReviewSessionResponse = z.infer<
  typeof StartWrongReviewSessionResponseSchema
>;
