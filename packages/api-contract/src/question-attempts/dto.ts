import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';
import { TagResponseSchema } from '../tags/dto.js';

export const QuestionAttemptOutcomeSchema = z.enum([
  'CORRECT',
  'INCORRECT',
  'OMITTED',
]);
export type QuestionAttemptOutcome = z.infer<
  typeof QuestionAttemptOutcomeSchema
>;

export const QuestionAttemptResponseSchema = z.object({
  id: z.string(),
  sessionItemId: z.string().nullable(),
  questionRevisionId: z.string(),
  questionId: z.string(),
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  outcome: QuestionAttemptOutcomeSchema,
  spentMilliseconds: z.number().int().nonnegative(),
  gradedAt: IsoDateStringSchema,
  tags: z.array(TagResponseSchema).optional(),
});
export type QuestionAttemptResponse = z.infer<
  typeof QuestionAttemptResponseSchema
>;
