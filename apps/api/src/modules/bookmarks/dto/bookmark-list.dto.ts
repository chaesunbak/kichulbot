import {
  CreateBookmarkListRequestSchema,
  UpdateBookmarkListRequestSchema,
} from '@kichulbot/api-contract/bookmarks';
import { createZodDto } from 'nestjs-zod';

export class CreateBookmarkListDto extends createZodDto(
  CreateBookmarkListRequestSchema,
) {}

export class UpdateBookmarkListDto extends createZodDto(
  UpdateBookmarkListRequestSchema,
) {}
