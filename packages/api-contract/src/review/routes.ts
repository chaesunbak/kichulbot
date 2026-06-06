import {
  CreateWrongQuestionSetRequestSchema,
  CreateWrongQuestionSetResponseSchema,
  GetWrongQuestionSetResponseSchema,
  StartWrongReviewSessionRequestSchema,
  StartWrongReviewSessionResponseSchema,
} from './dto.js';

export const reviewRoutes = {
  getWrongQuestionSet: {
    method: 'GET',
    path: '/me/wrong-question-sets',
    request: null,
    response: GetWrongQuestionSetResponseSchema,
  },
  createWrongQuestionSet: {
    method: 'POST',
    path: '/me/wrong-question-sets',
    request: CreateWrongQuestionSetRequestSchema,
    response: CreateWrongQuestionSetResponseSchema,
  },
  startLatestWrongQuestionSetSolveSession: {
    method: 'POST',
    path: '/me/wrong-question-sets/solve-sessions',
    request: StartWrongReviewSessionRequestSchema,
    response: StartWrongReviewSessionResponseSchema,
  },
  startWrongQuestionSetSolveSession: {
    method: 'POST',
    path: '/me/wrong-question-sets/:questionSetId/solve-sessions',
    request: StartWrongReviewSessionRequestSchema,
    response: StartWrongReviewSessionResponseSchema,
  },
} as const;
