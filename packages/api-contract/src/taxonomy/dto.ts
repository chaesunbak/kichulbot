import * as z from 'zod';
import { AdminTaxonomyResponseSchema, TaxonomyResponseSchema } from './schema.js';

export const ListExamsResponseSchema = z.object({
  exams: z.array(z.union([AdminTaxonomyResponseSchema, TaxonomyResponseSchema])),
});
export type ListExamsResponse = z.infer<typeof ListExamsResponseSchema>;

export const ListSubjectsResponseSchema = z.object({
  subjects: z.array(z.union([AdminTaxonomyResponseSchema, TaxonomyResponseSchema])),
});
export type ListSubjectsResponse = z.infer<typeof ListSubjectsResponseSchema>;
