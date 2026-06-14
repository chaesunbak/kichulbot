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
  isMockExamAvailable: z.boolean(),
});
export type ExamResponse = z.infer<typeof ExamResponseSchema>;

export const MockExamBlueprintItemResponseSchema = z.object({
  tagId: z.string(),
  minQuestionCount: z.number().int().min(0),
  maxQuestionCount: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
});
export type MockExamBlueprintItemResponse = z.infer<
  typeof MockExamBlueprintItemResponseSchema
>;

export const AdminTaxonomyResponseSchema = TaxonomyResponseSchema.extend({
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminTaxonomyResponse = z.infer<typeof AdminTaxonomyResponseSchema>;

export const AdminExamResponseSchema = ExamResponseSchema.extend({
  paperCount: z.number().int().min(0),
  mockExamQuestionCount: z.number().int().min(1).nullable(),
  eraTagGroupId: z.string().nullable(),
  mockExamBlueprintItems: z.array(MockExamBlueprintItemResponseSchema),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AdminExamResponse = z.infer<typeof AdminExamResponseSchema>;
