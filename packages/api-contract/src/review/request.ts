import * as z from 'zod';
import { StartSolveSessionResponseSchema } from '../solve-sessions/response.js';
import { DailyWrongQuestionSetResponseSchema } from './dto.js';

export const CreateWrongQuestionSetRequestSchema = z.strictObject({
  studyDate: z.iso.date().optional(),
});
export type CreateWrongQuestionSetRequest = z.infer<
  typeof CreateWrongQuestionSetRequestSchema
>;

export const StartWrongReviewSessionRequestSchema = z.strictObject({
  mode: z.enum(['ONE_BY_ONE', 'EXAM']).optional(),
});
export type StartWrongReviewSessionRequest = z.infer<
  typeof StartWrongReviewSessionRequestSchema
>;
