import * as z from 'zod';
import {
  AdminExamResponseSchema,
  AdminTaxonomyResponseSchema,
  CategoryResponseSchema,
  ExamResponseSchema,
  TaxonomyResponseSchema,
} from './schema.js';
import { PaperResponseSchema } from '../papers/schema.js';

export const ListExamsResponseSchema = z.object({
  exams: z.array(z.union([AdminExamResponseSchema, ExamResponseSchema])),
});
export type ListExamsResponse = z.infer<typeof ListExamsResponseSchema>;

export const ListExamPaperOverviewsQuerySchema = z.object({
  paperLimit: z.coerce.number().int().min(1).max(20).optional(),
});
export type ListExamPaperOverviewsQuery = z.infer<
  typeof ListExamPaperOverviewsQuerySchema
>;

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

export const ListExamPaperOverviewsResponseSchema = z.object({
  overviews: z.array(ExamPaperOverviewSchema),
});
export type ListExamPaperOverviewsResponse = z.infer<
  typeof ListExamPaperOverviewsResponseSchema
>;

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
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryIds: z.array(z.string().min(1)).optional(),
  usesMonth: z.boolean().optional(),
  usesRound: z.boolean().optional(),
  mockExamQuestionCount: z.number().int().min(1).max(100).nullable().optional(),
  eraTagGroupId: z.string().min(1).nullable().optional(),
  mockExamBlueprintItems: z
    .array(
      z
        .object({
          tagId: z.string().min(1),
          minQuestionCount: z.number().int().min(0).max(100),
          maxQuestionCount: z.number().int().min(0).max(100),
          sortOrder: z.number().int().min(0).optional(),
        })
        .refine((value) => value.minQuestionCount <= value.maxQuestionCount, {
          message: '최소 문항수는 최대 문항수보다 클 수 없습니다.',
          path: ['minQuestionCount'],
        }),
    )
    .max(100)
    .optional(),
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
