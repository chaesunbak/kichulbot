import * as z from 'zod';
import { AnswerModeSchema } from '../common.js';
import { StartSolveSessionResponseSchema } from '../solve-sessions/response.js';
import { MockExamGenerationResponseSchema } from './dto.js';

export const StartMockExamSolveSessionResponseSchema =
  StartSolveSessionResponseSchema.extend({
    generation: MockExamGenerationResponseSchema,
  });
export type StartMockExamSolveSessionResponse = z.infer<
  typeof StartMockExamSolveSessionResponseSchema
>;
