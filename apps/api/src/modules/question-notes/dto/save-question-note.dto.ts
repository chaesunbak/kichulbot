import { SaveQuestionNoteRequestSchema } from '@kichulbot/api-contract/question-notes';
import { createZodDto } from 'nestjs-zod';

export class SaveQuestionNoteDto extends createZodDto(
  SaveQuestionNoteRequestSchema,
) {}
