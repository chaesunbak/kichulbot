import {
  CreateCategoryRequestSchema,
  CreateExamRequestSchema,
} from '@kichulbot/api-contract/taxonomy';

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
});
