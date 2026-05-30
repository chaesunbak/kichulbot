import * as z from 'zod';
import { AdminQuestionResponseSchema } from './schema.js';

export const CreateQuestionRequestSchema = z.object({
  paperId: z.string().min(1),
  number: z.number().int().min(1).max(100),
  choiceCount: z.number().int().min(2).max(10),
  answer: z.number().int().min(1).max(10),
  tagIds: z.array(z.string().min(1)).optional(),
});
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;

export const UpdateQuestionRequestSchema = z.object({
  number: z.number().int().min(1).max(100).optional(),
  choiceCount: z.number().int().min(2).max(10).optional(),
  answer: z.number().int().min(1).max(10).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
});
export type UpdateQuestionRequest = z.infer<typeof UpdateQuestionRequestSchema>;

export const QuestionMutationResponseSchema = z.object({
  question: AdminQuestionResponseSchema,
});
export type QuestionMutationResponse = z.infer<
  typeof QuestionMutationResponseSchema
>;
