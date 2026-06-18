import { ListQuestionAttemptsQuerySchema } from '@kichulbot/api-contract/question-attempts';
import { createZodDto } from 'nestjs-zod';

export class ListQuestionAttemptsDto extends createZodDto(
  ListQuestionAttemptsQuerySchema,
) {}
