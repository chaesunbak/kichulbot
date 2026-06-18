import { CreateCategoryRequestSchema } from '@kichulbot/api-contract/taxonomy';
import { createZodDto } from 'nestjs-zod';

export class CreateCategoryDto extends createZodDto(
  CreateCategoryRequestSchema,
) {}
