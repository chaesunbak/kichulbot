import * as z from 'zod';
import { PaginationQuerySchema } from '../common.js';
import {
  SolveSessionResponseSchema,
  SolveSessionLogResponseSchema,
  AnswerResponseSchema,
  QuestionResultResponseSchema,
  SolveSessionLogStatusSchema,
} from './dto.js';

export const StartSolveSessionRequestSchema = z.strictObject({
  paperId: z.string().min(1),
  mode: z.enum(['ONE_BY_ONE', 'EXAM']),
});
export type StartSolveSessionRequest = z.infer<
  typeof StartSolveSessionRequestSchema
>;

export const SaveAnswerRequestSchema = z
  .strictObject({
    answerChoice: z.coerce.number().int().min(1).optional(),
    answerText: z.string().trim().min(1).optional(),
    spentMilliseconds: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (value) =>
      value.answerChoice !== undefined ||
      value.answerText ||
      value.spentMilliseconds !== undefined,
    {
      message: '답안을 입력해주세요.',
    },
  );
export type SaveAnswerRequest = z.infer<typeof SaveAnswerRequestSchema>;

export const ListSolveSessionLogsQuerySchema = PaginationQuerySchema.extend({
  status: SolveSessionLogStatusSchema.default('all'),
  submittedDate: z.iso.date().optional(),
});
export type ListSolveSessionLogsQuery = z.infer<
  typeof ListSolveSessionLogsQuerySchema
>;
