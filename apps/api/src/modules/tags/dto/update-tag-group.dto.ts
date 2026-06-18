import { UpdateTagGroupRequestSchema } from '@kichulbot/api-contract/tags';
import { createZodDto } from 'nestjs-zod';

export class UpdateTagGroupDto extends createZodDto(
  UpdateTagGroupRequestSchema,
) {}
