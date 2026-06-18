import * as z from 'zod';
import { QuestionNoteResponseSchema } from './dto.js';

export const SaveQuestionNoteRequestSchema = z.strictObject({
  content: z.string().max(5000),
});
export type SaveQuestionNoteRequest = z.infer<
  typeof SaveQuestionNoteRequestSchema
>;
