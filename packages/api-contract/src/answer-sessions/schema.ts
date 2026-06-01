import * as z from 'zod';
import {
  AnswerModeSchema,
  IsoDateStringSchema,
  QuestionTypeSchema,
} from '../common.js';
import { PaperResponseSchema } from '../papers/schema.js';

export const QuestionResultResponseSchema = z.object({
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  explanation: z.string().nullable(),
  isCorrect: z.boolean().nullable(),
});
export type QuestionResultResponse = z.infer<
  typeof QuestionResultResponseSchema
>;

export const SolveQuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  type: QuestionTypeSchema,
  imageUrl: z.string().url().nullable(),
  choiceCount: z.number().int().nullable(),
  recommendedTimeSeconds: z.number().int().nullable(),
  result: QuestionResultResponseSchema.nullable(),
});
export type SolveQuestionResponse = z.infer<typeof SolveQuestionResponseSchema>;

export const AnswerResponseSchema = z.object({
  questionId: z.string(),
  answerChoice: z.number().int().nullable(),
  answerText: z.string().nullable(),
  isCorrect: z.boolean().nullable(),
  spentMilliseconds: z.number().int().nonnegative(),
  updatedAt: IsoDateStringSchema,
});
export type AnswerResponse = z.infer<typeof AnswerResponseSchema>;

export const AnswerSessionResultResponseSchema = z.object({
  score: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  answeredCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  wrongCount: z.number().int().nonnegative(),
  totalSpentMilliseconds: z.number().int().nonnegative(),
});
export type AnswerSessionResultResponse = z.infer<
  typeof AnswerSessionResultResponseSchema
>;

export const AnswerSessionResponseSchema = z.object({
  id: z.string(),
  mode: AnswerModeSchema,
  paper: PaperResponseSchema.extend({
    questions: z.array(SolveQuestionResponseSchema),
  }),
  answers: z.array(AnswerResponseSchema),
  result: AnswerSessionResultResponseSchema.nullable(),
  submittedAt: IsoDateStringSchema.nullable(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type AnswerSessionResponse = z.infer<typeof AnswerSessionResponseSchema>;

export const AnswerSessionLogResponseSchema = z.object({
  id: z.string(),
  mode: AnswerModeSchema,
  paper: PaperResponseSchema,
  result: AnswerSessionResultResponseSchema,
  submittedAt: IsoDateStringSchema,
  createdAt: IsoDateStringSchema,
});
export type AnswerSessionLogResponse = z.infer<
  typeof AnswerSessionLogResponseSchema
>;
