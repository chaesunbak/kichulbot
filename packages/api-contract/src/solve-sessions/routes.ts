import {
  GetSolveSessionResponseSchema,
  ListSolveSessionLogsQuerySchema,
  ListSolveSessionLogsResponseSchema,
  SaveAnswerRequestSchema,
  SaveAnswerResponseSchema,
  StartSolveSessionRequestSchema,
  StartSolveSessionResponseSchema,
  SubmitSolveSessionResponseSchema,
} from './dto.js';

export const solveSessionsRoutes = {
  listSolveSessionLogs: {
    method: 'GET',
    path: '/me/solve-sessions',
    request: ListSolveSessionLogsQuerySchema,
    response: ListSolveSessionLogsResponseSchema,
  },
  startSolveSession: {
    method: 'POST',
    path: '/me/solve-sessions',
    request: StartSolveSessionRequestSchema,
    response: StartSolveSessionResponseSchema,
  },
  getSolveSession: {
    method: 'GET',
    path: '/me/solve-sessions/:id',
    request: null,
    response: GetSolveSessionResponseSchema,
  },
  saveAnswer: {
    method: 'PUT',
    path: '/me/solve-sessions/:id/answers/:questionId',
    request: SaveAnswerRequestSchema,
    response: SaveAnswerResponseSchema,
  },
  submitSolveSession: {
    method: 'POST',
    path: '/me/solve-sessions/:id/submissions',
    request: null,
    response: SubmitSolveSessionResponseSchema,
  },
} as const;
