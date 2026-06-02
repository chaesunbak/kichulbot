import * as z from 'zod';
import { QuestionAttemptResponseSchema } from './schema.js';

export const ListQuestionAttemptsQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  includeTags: z.coerce.boolean().optional(),
});
export type ListQuestionAttemptsQuery = z.infer<
  typeof ListQuestionAttemptsQuerySchema
>;

export const ListQuestionAttemptsResponseSchema = z.object({
  questionAttempts: z.array(QuestionAttemptResponseSchema),
});
export type ListQuestionAttemptsResponse = z.infer<
  typeof ListQuestionAttemptsResponseSchema
>;
