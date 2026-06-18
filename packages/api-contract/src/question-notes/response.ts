import * as z from 'zod';
import { QuestionNoteResponseSchema } from './dto.js';

export const QuestionNoteResponseEnvelopeSchema = z.object({
  note: QuestionNoteResponseSchema.nullable(),
});
export type QuestionNoteResponseEnvelope = z.infer<
  typeof QuestionNoteResponseEnvelopeSchema
>;
