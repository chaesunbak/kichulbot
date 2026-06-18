import * as z from 'zod';
import { BooleanInputSchema } from '../common.js';
import { PaperResponseSchema } from '../papers/dto.js';
import {
  AdminExamResponseSchema,
  AdminTaxonomyResponseSchema,
  CategoryResponseSchema,
  ExamResponseSchema,
  TaxonomyResponseSchema,
} from './dto.js';

export const ExamPaperOverviewSchema = z.object({
  exam: ExamResponseSchema,
  paperCount: z.number().int().min(0),
  papers: z.array(
    PaperResponseSchema.extend({
      registeredQuestionCount: z.number().int().min(0),
    }),
  ),
});
export type ExamPaperOverview = z.infer<typeof ExamPaperOverviewSchema>;

export const AdminListExamsResponseSchema = z.object({
  exams: z.array(AdminExamResponseSchema),
});
export type AdminListExamsResponse = z.infer<
  typeof AdminListExamsResponseSchema
>;

export const PublicListExamsResponseSchema = z.object({
  exams: z.array(ExamResponseSchema),
});
export type PublicListExamsResponse = z.infer<
  typeof PublicListExamsResponseSchema
>;

export const ListExamPaperOverviewsResponseSchema = z.object({
  overviews: z.array(ExamPaperOverviewSchema),
});
export type ListExamPaperOverviewsResponse = z.infer<
  typeof ListExamPaperOverviewsResponseSchema
>;

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

export const AdminListCategoriesResponseSchema = z.object({
  categories: z.array(AdminTaxonomyResponseSchema),
});
export type AdminListCategoriesResponse = z.infer<
  typeof AdminListCategoriesResponseSchema
>;

export const PublicListCategoriesResponseSchema = z.object({
  categories: z.array(CategoryResponseSchema),
});
export type PublicListCategoriesResponse = z.infer<
  typeof PublicListCategoriesResponseSchema
>;

export const ExamMutationResponseSchema = z.object({
  exam: AdminExamResponseSchema,
});
export type ExamMutationResponse = z.infer<typeof ExamMutationResponseSchema>;

export const DeleteExamResponseSchema = z.object({
  id: z.string(),
});
export type DeleteExamResponse = z.infer<typeof DeleteExamResponseSchema>;
