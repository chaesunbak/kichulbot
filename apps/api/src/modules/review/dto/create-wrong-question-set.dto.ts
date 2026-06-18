import { CreateWrongQuestionSetRequestSchema } from '@kichulbot/api-contract/review';
import { createZodDto } from 'nestjs-zod';

export class CreateWrongQuestionSetDto extends createZodDto(
  CreateWrongQuestionSetRequestSchema,
) {}
