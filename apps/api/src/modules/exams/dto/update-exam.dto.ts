import { UpdateExamRequestSchema } from '@kichulbot/api-contract/taxonomy';
import { createZodDto } from 'nestjs-zod';

export class UpdateExamDto extends createZodDto(UpdateExamRequestSchema) {}
