import { UpdateQuestionRequestSchema } from '@kichulbot/api-contract/questions';
import { createZodDto } from 'nestjs-zod';

export class UpdateQuestionDto extends createZodDto(
  UpdateQuestionRequestSchema,
) {}
