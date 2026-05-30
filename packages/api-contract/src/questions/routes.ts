import {
  CreateQuestionRequestSchema,
  UpdateQuestionRequestSchema,
  QuestionMutationResponseSchema,
} from './dto.js';

export const questionsRoutes = {
  createQuestion: {
    method: 'POST',
    path: '/admin/questions',
    request: CreateQuestionRequestSchema,
    response: QuestionMutationResponseSchema,
  },
  updateQuestion: {
    method: 'PATCH',
    path: '/admin/questions/:id',
    request: UpdateQuestionRequestSchema,
    response: QuestionMutationResponseSchema,
  },
} as const;
