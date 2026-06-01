import {
  CreateQuestionRequestSchema,
  DeleteQuestionResponseSchema,
  UpdateQuestionRequestSchema,
  QuestionMutationResponseSchema,
} from './dto.js';

export const questionsRoutes = {
  createQuestion: {
    method: 'POST',
    path: '/questions',
    request: CreateQuestionRequestSchema,
    response: QuestionMutationResponseSchema,
  },
  updateQuestion: {
    method: 'PATCH',
    path: '/questions/:id',
    request: UpdateQuestionRequestSchema,
    response: QuestionMutationResponseSchema,
  },
  deleteQuestion: {
    method: 'DELETE',
    path: '/questions/:id',
    request: null,
    response: DeleteQuestionResponseSchema,
  },
} as const;
