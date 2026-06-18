import { SaveAnswerRequestSchema } from '@kichulbot/api-contract/solve-sessions';
import { createZodDto } from 'nestjs-zod';

export class SaveAnswerDto extends createZodDto(SaveAnswerRequestSchema) {}
