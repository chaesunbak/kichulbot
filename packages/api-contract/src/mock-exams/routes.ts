import {
  StartMockExamSolveSessionRequestSchema,
  StartMockExamSolveSessionResponseSchema,
} from './dto.js';

export const mockExamsRoutes = {
  startMockExamSolveSession: {
    method: 'POST',
    path: '/me/mock-exams/solve-sessions',
    request: StartMockExamSolveSessionRequestSchema,
    response: StartMockExamSolveSessionResponseSchema,
  },
} as const;
