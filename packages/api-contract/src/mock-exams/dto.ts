import * as z from 'zod';

import { AnswerModeSchema } from '../common.js';
import { StartSolveSessionResponseSchema } from '../solve-sessions/dto.js';
import { MockExamGenerationResponseSchema } from './schema.js';

export const StartMockExamSolveSessionRequestSchema = z.object({
  examId: z.string().min(1),
  mode: AnswerModeSchema,
});
export type StartMockExamSolveSessionRequest = z.infer<
  typeof StartMockExamSolveSessionRequestSchema
>;

export const StartMockExamSolveSessionResponseSchema =
  StartSolveSessionResponseSchema.extend({
    generation: MockExamGenerationResponseSchema,
  });
export type StartMockExamSolveSessionResponse = z.infer<
  typeof StartMockExamSolveSessionResponseSchema
>;
