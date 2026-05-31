import {
  GetAnswerSessionResponseSchema,
  ListAnswerSessionLogsResponseSchema,
  SaveDraftAnswerRequestSchema,
  SaveDraftAnswerResponseSchema,
  StartAnswerSessionRequestSchema,
  StartAnswerSessionResponseSchema,
  SubmitAnswerSessionResponseSchema,
} from './dto.js';

export const answerSessionsRoutes = {
  listAnswerSessionLogs: {
    method: 'GET',
    path: '/answer-sessions',
    request: null,
    response: ListAnswerSessionLogsResponseSchema,
  },
  startAnswerSession: {
    method: 'POST',
    path: '/answer-sessions',
    request: StartAnswerSessionRequestSchema,
    response: StartAnswerSessionResponseSchema,
  },
  getAnswerSession: {
    method: 'GET',
    path: '/answer-sessions/:id',
    request: null,
    response: GetAnswerSessionResponseSchema,
  },
  saveDraftAnswer: {
    method: 'PATCH',
    path: '/answer-sessions/:id/answers/:questionId',
    request: SaveDraftAnswerRequestSchema,
    response: SaveDraftAnswerResponseSchema,
  },
  submitAnswerSession: {
    method: 'POST',
    path: '/answer-sessions/:id/submit',
    request: null,
    response: SubmitAnswerSessionResponseSchema,
  },
} as const;
