import * as z from 'zod';
import { PaginationQuerySchema, PaginatedResponseSchema } from '../common.js';
import {
  QuestionReportCategorySchema,
  QuestionReportResponseSchema,
  QuestionReportStatusSchema,
} from './dto.js';

export const CreateQuestionReportRequestSchema = z.strictObject({
  category: QuestionReportCategorySchema,
  content: z.string().trim().min(1).max(5000),
  questionRevisionId: z.string().min(1).optional(),
});
export type CreateQuestionReportRequest = z.infer<
  typeof CreateQuestionReportRequestSchema
>;

export const ListAdminQuestionReportsQuerySchema = PaginationQuerySchema.extend(
  {
    status: QuestionReportStatusSchema.optional(),
    category: QuestionReportCategorySchema.optional(),
    questionId: z.string().min(1).optional(),
  },
);
export type ListAdminQuestionReportsQuery = z.infer<
  typeof ListAdminQuestionReportsQuerySchema
>;

export const UpdateQuestionReportRequestSchema = z.strictObject({
  status: QuestionReportStatusSchema.optional(),
  adminMemo: z.string().trim().max(5000).nullable().optional(),
});
export type UpdateQuestionReportRequest = z.infer<
  typeof UpdateQuestionReportRequestSchema
>;
