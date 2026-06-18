import { StartWrongReviewSessionRequestSchema } from '@kichulbot/api-contract/review';
import { createZodDto } from 'nestjs-zod';

export class StartWrongReviewSessionDto extends createZodDto(
  StartWrongReviewSessionRequestSchema,
) {}
