import * as z from 'zod';
import { PaginationQuerySchema, PaginatedResponseSchema } from '../common.js';
import {
  QuestionReportCategorySchema,
  QuestionReportResponseSchema,
  QuestionReportStatusSchema,
} from './dto.js';

export const QuestionReportMutationResponseSchema = z.object({
  report: QuestionReportResponseSchema,
});
export type QuestionReportMutationResponse = z.infer<
  typeof QuestionReportMutationResponseSchema
>;

export const ListAdminQuestionReportsResponseSchema = PaginatedResponseSchema(
  QuestionReportResponseSchema,
);
export type ListAdminQuestionReportsResponse = z.infer<
  typeof ListAdminQuestionReportsResponseSchema
>;
