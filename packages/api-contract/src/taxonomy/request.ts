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

export const ListExamPaperOverviewsQuerySchema = z.strictObject({
  paperLimit: z.coerce.number().int().min(1).max(20).optional(),
});
export type ListExamPaperOverviewsQuery = z.infer<
  typeof ListExamPaperOverviewsQuerySchema
>;

export const CreateCategoryRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema =
  CreateCategoryRequestSchema.partial();
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

export const CreateExamRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(50),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryIds: z.array(z.string().min(1)).optional(),
  usesMonth: BooleanInputSchema.optional(),
  usesRound: BooleanInputSchema.optional(),
  mockExamQuestionCount: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .nullable()
    .optional(),
  eraTagGroupId: z.string().min(1).nullable().optional(),
  mockExamBlueprintItems: z
    .array(
      z
        .strictObject({
          tagId: z.string().min(1),
          minQuestionCount: z.coerce.number().int().min(0).max(100),
          maxQuestionCount: z.coerce.number().int().min(0).max(100),
          sortOrder: z.coerce.number().int().min(0).optional(),
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
