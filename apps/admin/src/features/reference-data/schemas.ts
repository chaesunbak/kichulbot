import {
  AdminExamResponseSchema,
  AdminTaxonomyResponseSchema,
  CreateCategoryRequestSchema,
  CreateExamRequestSchema,
} from '@kichulbot/api-contract/taxonomy';
import * as z from 'zod';

export const categoryFormSchema = CreateCategoryRequestSchema.extend({
  name: CreateCategoryRequestSchema.shape.name.min(
    1,
    '분류 이름을 입력해 주세요.',
  ),
});

export const examFormSchema = CreateExamRequestSchema.extend({
  name: CreateExamRequestSchema.shape.name.min(1, '시험 이름을 입력해 주세요.'),
  slug: CreateExamRequestSchema.shape.slug.min(
    1,
    '시험 슬러그를 입력해 주세요.',
  ),
  categoryIds: CreateExamRequestSchema.shape.categoryIds.unwrap(),
  usesMonth: CreateExamRequestSchema.shape.usesMonth.unwrap(),
  usesRound: CreateExamRequestSchema.shape.usesRound.unwrap(),
  mockExamQuestionCount: z.number().int().min(1).max(100).nullable(),
  eraTagGroupId: z.string().min(1).nullable(),
  mockExamBlueprintItems: z.array(
    z
      .object({
        tagId: z.string().min(1),
        minQuestionCount: z.number().int().min(0).max(100),
        maxQuestionCount: z.number().int().min(0).max(100),
        sortOrder: z.number().int().min(0),
      })
      .refine((value) => value.minQuestionCount <= value.maxQuestionCount, {
        message: '최소 문항수는 최대 문항수보다 클 수 없습니다.',
        path: ['minQuestionCount'],
      }),
  ),
});

export const adminListExamsResponseSchema = z.object({
  exams: z.array(AdminExamResponseSchema),
});

export const adminListCategoriesResponseSchema = z.object({
  categories: z.array(AdminTaxonomyResponseSchema),
});
