import * as z from 'zod';
import {
  createStringArrayInputSchema,
  GradingPolicySchema,
  QuestionTypeSchema,
} from '../common.js';
import { AdminQuestionResponseSchema } from './dto.js';

export const QuestionMutationResponseSchema = z.object({
  question: AdminQuestionResponseSchema,
});
export type QuestionMutationResponse = z.infer<
  typeof QuestionMutationResponseSchema
>;

export const DeleteQuestionResponseSchema = z.object({
  id: z.string(),
});
export type DeleteQuestionResponse = z.infer<
  typeof DeleteQuestionResponseSchema
>;
