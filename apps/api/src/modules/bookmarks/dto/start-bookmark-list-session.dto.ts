import { StartBookmarkListSessionRequestSchema } from '@kichulbot/api-contract/bookmarks';
import { createZodDto } from 'nestjs-zod';

export class StartBookmarkListSessionDto extends createZodDto(
  StartBookmarkListSessionRequestSchema,
) {}
