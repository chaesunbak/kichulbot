import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';
import { TaxonomyResponseSchema } from '../taxonomy/schema.js';

export const QuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  imageUrl: z.string().url().nullable(),
  choiceCount: z.number().int(),
  answer: z.number().int(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const PaperResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int(),
  questionCount: z.number().int(),
  exam: TaxonomyResponseSchema,
  subject: TaxonomyResponseSchema,
});
export type PaperResponse = z.infer<typeof PaperResponseSchema>;

export const AdminPaperResponseSchema = PaperResponseSchema.extend({
  isPublished: z.boolean(),
  registeredQuestionCount: z.number().int(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
  questions: z.array(QuestionResponseSchema).optional(),
});
export type AdminPaperResponse = z.infer<typeof AdminPaperResponseSchema>;
