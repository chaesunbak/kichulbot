import * as z from 'zod';
import { PaginationQuerySchema } from '../common.js';
import {
  SolveSessionResponseSchema,
  SolveSessionLogResponseSchema,
  AnswerResponseSchema,
  QuestionResultResponseSchema,
} from './schema.js';

export const StartSolveSessionRequestSchema = z.object({
  paperId: z.string().min(1),
  mode: z.enum(['ONE_BY_ONE', 'EXAM']),
});
export type StartSolveSessionRequest = z.infer<
  typeof StartSolveSessionRequestSchema
>;

export const StartSolveSessionResponseSchema = z.object({
  session: SolveSessionResponseSchema,
});
export type StartSolveSessionResponse = z.infer<
  typeof StartSolveSessionResponseSchema
>;

export const GetSolveSessionResponseSchema = StartSolveSessionResponseSchema;
export type GetSolveSessionResponse = z.infer<
  typeof GetSolveSessionResponseSchema
>;

export const SaveAnswerRequestSchema = z
  .object({
    answerChoice: z.number().int().min(1).optional(),
    answerText: z.string().trim().min(1).optional(),
    spentMilliseconds: z.number().int().nonnegative().optional(),
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

export const SaveAnswerResponseSchema = z.object({
  answer: AnswerResponseSchema,
  result: QuestionResultResponseSchema.nullable(),
});
export type SaveAnswerResponse = z.infer<typeof SaveAnswerResponseSchema>;

export const SubmitSolveSessionResponseSchema = StartSolveSessionResponseSchema;
export type SubmitSolveSessionResponse = z.infer<
  typeof SubmitSolveSessionResponseSchema
>;

export const SolveSessionLogStatusSchema = z.enum([
  'all',
  'completed',
  'in_progress',
]);
export type SolveSessionLogStatus = z.infer<typeof SolveSessionLogStatusSchema>;

export const ListSolveSessionLogsQuerySchema = PaginationQuerySchema.extend({
  status: SolveSessionLogStatusSchema.default('all'),
  submittedDate: z.iso.date().optional(),
});
export type ListSolveSessionLogsQuery = z.infer<
  typeof ListSolveSessionLogsQuerySchema
>;

export const ListSolveSessionLogsResponseSchema = z.object({
  logs: z.array(SolveSessionLogResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type ListSolveSessionLogsResponse = z.infer<
  typeof ListSolveSessionLogsResponseSchema
>;
