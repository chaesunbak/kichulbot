import * as z from 'zod';
import { QuestionAttemptResponseSchema } from './dto.js';

export const ListQuestionAttemptsResponseSchema = z.object({
  questionAttempts: z.array(QuestionAttemptResponseSchema),
});
export type ListQuestionAttemptsResponse = z.infer<
  typeof ListQuestionAttemptsResponseSchema
>;
