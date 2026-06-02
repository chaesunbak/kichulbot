import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const QuestionReportCategorySchema = z.enum([
  'QUESTION_ERROR',
  'IMAGE_ERROR',
  'CHOICE_ERROR',
  'ANSWER_ERROR',
  'EXPLANATION_ERROR',
  'CATEGORY_ERROR',
  'OTHER',
]);
export type QuestionReportCategory = z.infer<
  typeof QuestionReportCategorySchema
>;

export const QuestionReportStatusSchema = z.enum([
  'PENDING',
  'IN_REVIEW',
  'RESOLVED',
  'DISMISSED',
]);
export type QuestionReportStatus = z.infer<typeof QuestionReportStatusSchema>;

export const QuestionReportUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  nickname: z.string().nullable(),
});
export type QuestionReportUser = z.infer<typeof QuestionReportUserSchema>;

export const QuestionReportQuestionSchema = z.object({
  id: z.string(),
  paperId: z.string(),
  paperTitle: z.string(),
  number: z.number().int().positive(),
});
export type QuestionReportQuestion = z.infer<
  typeof QuestionReportQuestionSchema
>;

export const QuestionReportResponseSchema = z.object({
  id: z.string(),
  reporterUserId: z.string().nullable(),
  questionId: z.string(),
  questionRevisionId: z.string().nullable(),
  category: QuestionReportCategorySchema,
  content: z.string(),
  status: QuestionReportStatusSchema,
  adminMemo: z.string().nullable(),
  reviewedByUserId: z.string().nullable(),
  reviewedAt: IsoDateStringSchema.nullable(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
  question: QuestionReportQuestionSchema.optional(),
  reporter: QuestionReportUserSchema.nullable().optional(),
  reviewedBy: QuestionReportUserSchema.nullable().optional(),
});
export type QuestionReportResponse = z.infer<
  typeof QuestionReportResponseSchema
>;
