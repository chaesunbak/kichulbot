import { CreateQuestionRequestSchema } from '@kichulbot/api-contract/questions';
import { createZodDto } from 'nestjs-zod';

export class CreateQuestionDto extends createZodDto(
  CreateQuestionRequestSchema,
) {}
