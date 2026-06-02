import * as z from 'zod';
import { QuestionNoteResponseSchema } from './schema.js';

export const SaveQuestionNoteRequestSchema = z.object({
  content: z.string().max(5000),
});
export type SaveQuestionNoteRequest = z.infer<
  typeof SaveQuestionNoteRequestSchema
>;

export const QuestionNoteResponseEnvelopeSchema = z.object({
  note: QuestionNoteResponseSchema.nullable(),
});
export type QuestionNoteResponseEnvelope = z.infer<
  typeof QuestionNoteResponseEnvelopeSchema
>;
