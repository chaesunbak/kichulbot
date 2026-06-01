import * as z from 'zod';
import {
  AdminExamResponseSchema,
  AdminTaxonomyResponseSchema,
  CategoryResponseSchema,
  ExamResponseSchema,
  TaxonomyResponseSchema,
} from './schema.js';

export const ListExamsResponseSchema = z.object({
  exams: z.array(z.union([AdminExamResponseSchema, ExamResponseSchema])),
});
export type ListExamsResponse = z.infer<typeof ListExamsResponseSchema>;

export const CreateCategoryRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema =
  CreateCategoryRequestSchema.partial();
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

export const CategoryMutationResponseSchema = z.object({
  category: AdminTaxonomyResponseSchema,
});
export type CategoryMutationResponse = z.infer<
  typeof CategoryMutationResponseSchema
>;

export const DeleteCategoryResponseSchema = z.object({
  id: z.string(),
});
export type DeleteCategoryResponse = z.infer<
  typeof DeleteCategoryResponseSchema
>;

export const ListCategoriesResponseSchema = z.object({
  categories: z.array(
    z.union([AdminTaxonomyResponseSchema, CategoryResponseSchema]),
  ),
});
export type ListCategoriesResponse = z.infer<
  typeof ListCategoriesResponseSchema
>;

export const CreateExamRequestSchema = z.object({
  name: z.string().trim().min(1).max(50),
  categoryIds: z.array(z.string().min(1)).min(1),
  usesMonth: z.boolean().optional(),
  usesRound: z.boolean().optional(),
});
export type CreateExamRequest = z.infer<typeof CreateExamRequestSchema>;

export const UpdateExamRequestSchema = CreateExamRequestSchema.partial();
export type UpdateExamRequest = z.infer<typeof UpdateExamRequestSchema>;

export const ExamMutationResponseSchema = z.object({
  exam: AdminExamResponseSchema,
});
export type ExamMutationResponse = z.infer<typeof ExamMutationResponseSchema>;

export const DeleteExamResponseSchema = z.object({
  id: z.string(),
});
export type DeleteExamResponse = z.infer<typeof DeleteExamResponseSchema>;
