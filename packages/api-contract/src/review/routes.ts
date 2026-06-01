import {
  GetTodayWrongQuestionsResponseSchema,
  RefreshTodayWrongQuestionSetResponseSchema,
  StartWrongReviewSessionRequestSchema,
  StartWrongReviewSessionResponseSchema,
} from './dto.js';

export const reviewRoutes = {
  getTodayWrongQuestions: {
    method: 'GET',
    path: '/me/wrong-questions',
    request: null,
    response: GetTodayWrongQuestionsResponseSchema,
  },
  refreshTodayWrongQuestionSet: {
    method: 'POST',
    path: '/me/wrong-question-sets/today/refresh',
    request: null,
    response: RefreshTodayWrongQuestionSetResponseSchema,
  },
  startWrongReviewSession: {
    method: 'POST',
    path: '/answer-sessions/wrong-review',
    request: StartWrongReviewSessionRequestSchema,
    response: StartWrongReviewSessionResponseSchema,
  },
} as const;
