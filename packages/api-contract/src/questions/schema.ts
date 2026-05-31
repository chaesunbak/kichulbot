import * as z from 'zod';
import { IsoDateStringSchema, QuestionTypeSchema } from '../common.js';
import { TagResponseSchema } from '../tags/schema.js';

export const AdminQuestionResponseSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  number: z.number().int(),
  type: QuestionTypeSchema,
  imageUrl: z.string().url().nullable(),
  choiceCount: z.number().int().nullable(),
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  tags: z.array(TagResponseSchema),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminQuestionResponse = z.infer<typeof AdminQuestionResponseSchema>;
