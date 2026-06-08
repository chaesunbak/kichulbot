import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const TaxonomyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type TaxonomyResponse = z.infer<typeof TaxonomyResponseSchema>;

export const CategoryResponseSchema = TaxonomyResponseSchema;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export const ExamResponseSchema = TaxonomyResponseSchema.extend({
  slug: z.string(),
  categories: z.array(CategoryResponseSchema),
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
  paperCount: z.number().int().min(0),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminExamResponse = z.infer<typeof AdminExamResponseSchema>;
