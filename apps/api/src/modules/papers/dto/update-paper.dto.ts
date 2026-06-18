import { UpdatePaperRequestSchema } from '@kichulbot/api-contract/papers';
import { createZodDto } from 'nestjs-zod';

export class UpdatePaperDto extends createZodDto(UpdatePaperRequestSchema) {}
