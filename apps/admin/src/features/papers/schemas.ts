import { CreatePaperRequestSchema } from '@kichulbot/api-contract/papers';
import * as z from 'zod';

const paperBaseSchema = CreatePaperRequestSchema.extend({
  title: z
    .string()
    .min(2, '문제지 제목을 입력해 주세요.')
    .max(100, '문제지 제목은 100자 이하여야 합니다.'),
  year: z
    .number()
    .int('연도는 정수로 입력해 주세요.')
    .min(1994, '1994년 이후 연도를 입력해 주세요.')
    .max(2100, '2100년 이하 연도를 입력해 주세요.'),
  month: z.number().int().min(1).max(12).nullable().optional(),
  grade: z.number().int().min(1).max(3).nullable().optional(),
  round: z.number().int().min(1).nullable().optional(),
  examId: z.string().min(1, '시험을 선택해 주세요.'),
  questionCount: z
    .number()
    .int('문항 수는 정수로 입력해 주세요.')
    .min(1, '문항 수는 1개 이상이어야 합니다.')
    .max(100, '문항 수는 100개 이하여야 합니다.'),
});

export const paperSchema = paperBaseSchema.omit({ isPublished: true }).extend({
  isPublished: z.enum(['false', 'true']),
});

export const updatePaperMetadataSchema = z.object({
  title: z
    .string()
    .min(2, '문제지 제목을 입력해 주세요.')
    .max(100, '문제지 제목은 100자 이하여야 합니다.'),
  year: z
    .number()
    .int('연도는 정수로 입력해 주세요.')
    .min(1994, '1994년 이후 연도를 입력해 주세요.')
    .max(2100, '2100년 이하 연도를 입력해 주세요.'),
  round: z
    .number()
    .int('회차는 정수로 입력해 주세요.')
    .min(1)
    .nullable()
    .optional(),
});

export const importPaperSchema = paperBaseSchema.extend({
  isPublished: z.boolean(),
  layout: z.enum(['korean-history', 'csat']),
  variant: z.enum(['odd', 'even', 'both']),
  questionPdf: z.custom<File | null>((value) => value instanceof File, {
    message: '문제 PDF를 선택해 주세요.',
  }),
  answerPdf: z.custom<File | null>((value) => value instanceof File, {
    message: '답지 PDF를 선택해 주세요.',
  }),
});
