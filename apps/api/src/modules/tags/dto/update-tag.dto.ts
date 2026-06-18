import { UpdateTagRequestSchema } from '@kichulbot/api-contract/tags';
import { createZodDto } from 'nestjs-zod';

export class UpdateTagDto extends createZodDto(UpdateTagRequestSchema) {}
