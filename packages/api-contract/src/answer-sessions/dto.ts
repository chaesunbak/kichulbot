import * as z from 'zod';
import {
  AnswerSessionResponseSchema,
  AnswerSessionLogResponseSchema,
  AnswerResponseSchema,
  QuestionResultResponseSchema,
} from './schema.js';

export const StartAnswerSessionRequestSchema = z.object({
  paperId: z.string().min(1),
  mode: z.enum(['ONE_BY_ONE', 'EXAM']),
});
export type StartAnswerSessionRequest = z.infer<
  typeof StartAnswerSessionRequestSchema
>;

export const StartAnswerSessionResponseSchema = z.object({
  session: AnswerSessionResponseSchema,
});
export type StartAnswerSessionResponse = z.infer<
  typeof StartAnswerSessionResponseSchema
>;

export const GetAnswerSessionResponseSchema = StartAnswerSessionResponseSchema;
export type GetAnswerSessionResponse = z.infer<
  typeof GetAnswerSessionResponseSchema
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

export const SubmitAnswerSessionResponseSchema =
  StartAnswerSessionResponseSchema;
export type SubmitAnswerSessionResponse = z.infer<
  typeof SubmitAnswerSessionResponseSchema
>;

export const ListAnswerSessionLogsResponseSchema = z.object({
  logs: z.array(AnswerSessionLogResponseSchema),
});
export type ListAnswerSessionLogsResponse = z.infer<
  typeof ListAnswerSessionLogsResponseSchema
>;
