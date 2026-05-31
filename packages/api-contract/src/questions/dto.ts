import * as z from 'zod';
import { QuestionTypeSchema } from '../common.js';
import { AdminQuestionResponseSchema } from './schema.js';

export const CreateQuestionRequestSchema = z
  .object({
    paperId: z.string().min(1),
    number: z.number().int().min(1).max(100),
    type: QuestionTypeSchema.optional(),
    choiceCount: z.number().int().min(2).max(10).optional(),
    answerChoice: z.number().int().min(1).max(10).optional(),
    answerText: z.string().trim().min(1).max(2000).optional(),
    tagIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine(({ type, choiceCount, answerChoice, answerText }, ctx) => {
    if ((type ?? 'MULTIPLE_CHOICE') === 'MULTIPLE_CHOICE') {
      if (choiceCount === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '객관식 문항은 선택지 개수가 필요합니다.',
          path: ['choiceCount'],
        });
      }
      if (answerChoice === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '객관식 문항은 정답 번호가 필요합니다.',
          path: ['answerChoice'],
        });
      }
      return;
    }

    if (!answerText) {
      ctx.addIssue({
        code: 'custom',
        message: '서술형 문항은 모범답안이 필요합니다.',
        path: ['answerText'],
      });
    }
  });
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;

export const UpdateQuestionRequestSchema = z.object({
  number: z.number().int().min(1).max(100).optional(),
  type: QuestionTypeSchema.optional(),
  choiceCount: z.number().int().min(2).max(10).optional(),
  answerChoice: z.number().int().min(1).max(10).optional(),
  answerText: z.string().trim().min(1).max(2000).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
});
export type UpdateQuestionRequest = z.infer<typeof UpdateQuestionRequestSchema>;

export const QuestionMutationResponseSchema = z.object({
  question: AdminQuestionResponseSchema,
});
export type QuestionMutationResponse = z.infer<
  typeof QuestionMutationResponseSchema
>;

export const DeleteQuestionResponseSchema = z.object({
  id: z.string(),
});
export type DeleteQuestionResponse = z.infer<
  typeof DeleteQuestionResponseSchema
>;
