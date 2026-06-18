import { UpdateCategoryRequestSchema } from '@kichulbot/api-contract/taxonomy';
import { createZodDto } from 'nestjs-zod';

export class UpdateCategoryDto extends createZodDto(
  UpdateCategoryRequestSchema,
) {}
