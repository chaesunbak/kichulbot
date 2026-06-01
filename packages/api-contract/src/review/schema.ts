import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const WrongQuestionResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  imageUrl: z.string().nullable(),
  sourceOutcome: z.enum(['INCORRECT', 'OMITTED']),
  paper: z.object({
    id: z.string(),
    title: z.string(),
    year: z.number().int(),
    examName: z.string(),
    subjectName: z.string(),
  }),
});
export type WrongQuestionResponse = z.infer<typeof WrongQuestionResponseSchema>;

export const DailyWrongQuestionSetResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  studyDate: z.iso.date(),
  questionCount: z.number().int().nonnegative(),
  questions: z.array(WrongQuestionResponseSchema),
  generatedAt: IsoDateStringSchema,
});
export type DailyWrongQuestionSetResponse = z.infer<
  typeof DailyWrongQuestionSetResponseSchema
>;
