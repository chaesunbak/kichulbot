import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';
import { TagResponseSchema } from '../tags/schema.js';

export const AdminQuestionResponseSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  number: z.number().int(),
  imageUrl: z.string().url().nullable(),
  choiceCount: z.number().int(),
  answer: z.number().int(),
  tags: z.array(TagResponseSchema),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminQuestionResponse = z.infer<typeof AdminQuestionResponseSchema>;
