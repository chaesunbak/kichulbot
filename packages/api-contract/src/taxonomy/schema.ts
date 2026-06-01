import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const TaxonomyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export type TaxonomyResponse = z.infer<typeof TaxonomyResponseSchema>;

export const ExamResponseSchema = TaxonomyResponseSchema.extend({
  usesMonth: z.boolean(),
  usesGrade: z.boolean(),
  usesRound: z.boolean(),
});
export type ExamResponse = z.infer<typeof ExamResponseSchema>;

export const AdminTaxonomyResponseSchema = TaxonomyResponseSchema.extend({
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTaxonomyResponse = z.infer<typeof AdminTaxonomyResponseSchema>;

export const AdminExamResponseSchema = ExamResponseSchema.extend({
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminExamResponse = z.infer<typeof AdminExamResponseSchema>;
