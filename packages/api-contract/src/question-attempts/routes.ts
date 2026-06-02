import {
  ListQuestionAttemptsQuerySchema,
  ListQuestionAttemptsResponseSchema,
} from './dto.js';

export const questionAttemptsRoutes = {
  listQuestionAttempts: {
    method: 'GET',
    path: '/me/question-attempts',
    request: ListQuestionAttemptsQuerySchema,
    response: ListQuestionAttemptsResponseSchema,
  },
} as const;
