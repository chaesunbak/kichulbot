import * as z from 'zod';
import {
  AnswerModeSchema,
  GradingPolicySchema,
  IsoDateStringSchema,
  QuestionTypeSchema,
} from '../common.js';
import { PaperResponseSchema } from '../papers/schema.js';

export const QuestionResultResponseSchema = z.object({
  gradingPolicy: GradingPolicySchema,
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
  questionRevisionId: z.string(),
  number: z.number().int(),
  type: QuestionTypeSchema,
  imageUrl: z.string().url(),
  imageCacheKey: z.string().min(1),
  choiceCount: z.number().int().nullable(),
  points: z.number().int(),
  recommendedTimeSeconds: z.number().int().nullable(),
  isBookmarked: z.boolean(),
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

export const SolveSessionResultResponseSchema = z.object({
  score: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  answeredCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  wrongCount: z.number().int().nonnegative(),
  totalSpentMilliseconds: z.number().int().nonnegative(),
});
export type SolveSessionResultResponse = z.infer<
  typeof SolveSessionResultResponseSchema
>;

export const SolveSessionProgressResponseSchema = z.object({
  answeredCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  percent: z.number().int().min(0).max(100),
});
export type SolveSessionProgressResponse = z.infer<
  typeof SolveSessionProgressResponseSchema
>;

export const SolveSessionResponseSchema = z.object({
  id: z.string(),
  mode: AnswerModeSchema,
  paper: PaperResponseSchema.extend({
    questions: z.array(SolveQuestionResponseSchema),
  }),
  answers: z.array(AnswerResponseSchema),
  result: SolveSessionResultResponseSchema.nullable(),
  submittedAt: IsoDateStringSchema.nullable(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type SolveSessionResponse = z.infer<typeof SolveSessionResponseSchema>;

export const SolveSessionLogResponseSchema = z.object({
  id: z.string(),
  mode: AnswerModeSchema,
  paper: PaperResponseSchema,
  result: SolveSessionResultResponseSchema.nullable(),
  progress: SolveSessionProgressResponseSchema,
  submittedAt: IsoDateStringSchema.nullable(),
  totalSpentMilliseconds: z.number().int().nonnegative(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type SolveSessionLogResponse = z.infer<
  typeof SolveSessionLogResponseSchema
>;
