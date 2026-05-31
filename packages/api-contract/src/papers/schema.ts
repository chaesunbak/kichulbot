import * as z from 'zod';
import { IsoDateStringSchema, QuestionTypeSchema } from '../common.js';
import { TagResponseSchema } from '../tags/schema.js';
import { TaxonomyResponseSchema } from '../taxonomy/schema.js';

export const QuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  type: QuestionTypeSchema,
  imageUrl: z.string().url().nullable(),
  choiceCount: z.number().int().nullable(),
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

export const AdminPaperQuestionResponseSchema = QuestionResponseSchema.extend({
  tags: z.array(TagResponseSchema).default([]),
});
export type AdminPaperQuestionResponse = z.infer<
  typeof AdminPaperQuestionResponseSchema
>;

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
  questions: z.array(AdminPaperQuestionResponseSchema).optional(),
});
export type AdminPaperResponse = z.infer<typeof AdminPaperResponseSchema>;
