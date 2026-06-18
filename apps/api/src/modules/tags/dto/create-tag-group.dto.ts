import { CreateTagGroupRequestSchema } from '@kichulbot/api-contract/tags';
import { createZodDto } from 'nestjs-zod';

export class CreateTagGroupDto extends createZodDto(
  CreateTagGroupRequestSchema,
) {}
