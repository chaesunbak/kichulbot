import * as z from 'zod';
import { PaginationQuerySchema } from '../common.js';
import {
  SolveSessionResponseSchema,
  SolveSessionLogResponseSchema,
  AnswerResponseSchema,
  QuestionResultResponseSchema,
} from './dto.js';

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

export const SaveAnswerResponseSchema = z.object({
  answer: AnswerResponseSchema,
  result: QuestionResultResponseSchema.nullable(),
});
export type SaveAnswerResponse = z.infer<typeof SaveAnswerResponseSchema>;

export const SubmitSolveSessionResponseSchema = StartSolveSessionResponseSchema;
export type SubmitSolveSessionResponse = z.infer<
  typeof SubmitSolveSessionResponseSchema
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
