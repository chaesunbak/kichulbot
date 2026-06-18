import * as z from 'zod';
import { AnswerModeSchema } from '../common.js';
import { StartSolveSessionResponseSchema } from '../solve-sessions/response.js';
import { MockExamGenerationResponseSchema } from './dto.js';

export const StartMockExamSolveSessionRequestSchema = z.strictObject({
  examId: z.string().min(1),
  mode: AnswerModeSchema,
});
export type StartMockExamSolveSessionRequest = z.infer<
  typeof StartMockExamSolveSessionRequestSchema
>;
