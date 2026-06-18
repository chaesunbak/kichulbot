import * as z from 'zod';
import { IsoDateStringSchema } from '../common.js';

export const QuestionNoteResponseSchema = z.object({
  questionId: z.string(),
  content: z.string(),
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type QuestionNoteResponse = z.infer<typeof QuestionNoteResponseSchema>;
