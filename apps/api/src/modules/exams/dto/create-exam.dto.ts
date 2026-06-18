import { CreateExamRequestSchema } from '@kichulbot/api-contract/taxonomy';
import { createZodDto } from 'nestjs-zod';

export class CreateExamDto extends createZodDto(CreateExamRequestSchema) {}
