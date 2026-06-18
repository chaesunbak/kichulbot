import {
  CreateTagGroupRequestSchema,
  CreateTagRequestSchema,
} from '@kichulbot/api-contract/tags';
import * as z from 'zod';

export const tagFormSchema = CreateTagRequestSchema.extend({
  name: CreateTagRequestSchema.shape.name.min(1, '태그 이름을 입력해 주세요.'),
  keywords: z.array(z.string().trim().min(1).max(50)),
  examId: CreateTagRequestSchema.shape.examId.min(1, '시험을 선택해 주세요.'),
  tagGroupId: CreateTagRequestSchema.shape.tagGroupId,
  sortOrder: z.number().int().min(0),
});

export const tagGroupFormSchema = CreateTagGroupRequestSchema.extend({
  examId: CreateTagGroupRequestSchema.shape.examId.min(
    1,
    '시험을 선택해 주세요.',
  ),
  name: CreateTagGroupRequestSchema.shape.name.min(
    1,
    '그룹 이름을 입력해 주세요.',
  ),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});
