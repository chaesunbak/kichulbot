import * as z from 'zod';
import { BooleanInputSchema } from '../common.js';
import { QuestionAttemptResponseSchema } from './dto.js';

export const ListQuestionAttemptsQuerySchema = z.strictObject({
  from: z.iso.date(),
  to: z.iso.date(),
  includeTags: BooleanInputSchema.optional(),
});
export type ListQuestionAttemptsQuery = z.infer<
  typeof ListQuestionAttemptsQuerySchema
>;
