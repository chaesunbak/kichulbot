import * as z from 'zod';
import {
  BooleanInputSchema,
  GradingPolicySchema,
  QuestionTypeSchema,
} from '../common.js';
import {
  AdminPaperResponseSchema,
  CreatePaperQuestionRequestSchema,
  PaperQuestionResponseSchema,
  PaperResponseSchema,
} from './dto.js';

export const CreatePaperRequestSchema = z.strictObject({
  title: z.string().min(1).max(100),
  year: z.coerce.number().int().min(1994).max(2100),
  month: z.coerce.number().int().min(1).max(12).nullable().optional(),
  grade: z.coerce.number().int().min(1).max(3).nullable().optional(),
  round: z.coerce.number().int().min(1).nullable().optional(),
  examId: z.string().min(1),
  questionCount: z.coerce.number().int().min(1).max(100).optional(),
  isPublished: BooleanInputSchema.optional(),
});
export type CreatePaperRequest = z.infer<typeof CreatePaperRequestSchema>;

export const CreatePaperWithQuestionsRequestSchema = z.strictObject({
  paper: CreatePaperRequestSchema,
  questions: z.array(CreatePaperQuestionRequestSchema).min(1).max(100),
});
export type CreatePaperWithQuestionsRequest = z.infer<
  typeof CreatePaperWithQuestionsRequestSchema
>;

export const CreatePaperImportJobRequestSchema =
  CreatePaperRequestSchema.extend({
    layout: z.string().min(1).default('korean-history'),
    variant: z.string().min(1).default('odd'),
    dpi: z.coerce.number().int().min(72).max(600).optional(),
    imageFormat: z.string().min(1).default('webp'),
    quality: z.coerce.number().int().min(1).max(100).optional(),
  });
export type CreatePaperImportJobRequest = z.infer<
  typeof CreatePaperImportJobRequestSchema
>;

export const UpdatePaperImportJobStatusRequestSchema = z
  .strictObject({
    status: z.enum(['PENDING', 'PROCESSING', 'FAILED']),
    errorMessage: z.string().max(4000).optional(),
  })
  .superRefine((value, context) => {
    if (value.status === 'FAILED' && !value.errorMessage) {
      context.addIssue({
        code: 'custom',
        path: ['errorMessage'],
        message: '실패 상태에는 오류 메시지가 필요합니다.',
      });
    }
  });
export type UpdatePaperImportJobStatusRequest = z.infer<
  typeof UpdatePaperImportJobStatusRequestSchema
>;

export const SavePaperImportJobResultRequestSchema = z.strictObject({
  resultJsonPath: z.string().min(1),
});
export type SavePaperImportJobResultRequest = z.infer<
  typeof SavePaperImportJobResultRequestSchema
>;

export const UpdatePaperRequestSchema = z
  .strictObject({
    title: z.string().min(1).max(100).optional(),
    year: z.coerce.number().int().min(1994).max(2100).optional(),
    round: z.coerce.number().int().min(1).nullable().optional(),
    isPublished: BooleanInputSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: '수정할 문제지 정보를 입력해 주세요.',
  });
export type UpdatePaperRequest = z.infer<typeof UpdatePaperRequestSchema>;

export const ListPapersQuerySchema = z.object({
  examId: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
});
export type ListPapersQuery = z.infer<typeof ListPapersQuerySchema>;
