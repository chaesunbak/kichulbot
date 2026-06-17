import {
  CreateQuestionReportRequestSchema,
  ListAdminQuestionReportsQuerySchema,
  ListAdminQuestionReportsResponseSchema,
  QuestionReportMutationResponseSchema,
  UpdateQuestionReportRequestSchema,
} from './dto.js';

export const questionReportRoutes = {
  createQuestionReport: {
    method: 'POST',
    path: '/me/question-reports/:questionId',
    request: CreateQuestionReportRequestSchema,
    response: QuestionReportMutationResponseSchema,
  },
  createPublicQuestionReport: {
    method: 'POST',
    path: '/public/question-reports/:questionId',
    request: CreateQuestionReportRequestSchema,
    response: QuestionReportMutationResponseSchema,
  },
  listAdminQuestionReports: {
    method: 'GET',
    path: '/admin/question-reports',
    request: ListAdminQuestionReportsQuerySchema,
    response: ListAdminQuestionReportsResponseSchema,
  },
  updateQuestionReport: {
    method: 'PATCH',
    path: '/admin/question-reports/:reportId',
    request: UpdateQuestionReportRequestSchema,
    response: QuestionReportMutationResponseSchema,
  },
} as const;
