import * as z from 'zod';
import {
  AdminExamResponseSchema,
  AdminTaxonomyResponseSchema,
  ExamResponseSchema,
  TaxonomyResponseSchema,
} from './schema.js';

export const ListExamsResponseSchema = z.object({
  exams: z.array(z.union([AdminExamResponseSchema, ExamResponseSchema])),
});
export type ListExamsResponse = z.infer<typeof ListExamsResponseSchema>;

export const ListSubjectsResponseSchema = z.object({
  subjects: z.array(
    z.union([AdminTaxonomyResponseSchema, TaxonomyResponseSchema]),
  ),
});
export type ListSubjectsResponse = z.infer<typeof ListSubjectsResponseSchema>;
