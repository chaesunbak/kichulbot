import { CreateTagRequestSchema } from '@kichulbot/api-contract/tags';
import { createZodDto } from 'nestjs-zod';

export class CreateTagDto extends createZodDto(CreateTagRequestSchema) {}
