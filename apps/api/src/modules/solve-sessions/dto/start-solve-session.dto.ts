import { StartSolveSessionRequestSchema } from '@kichulbot/api-contract/solve-sessions';
import { createZodDto } from 'nestjs-zod';

export class StartSolveSessionDto extends createZodDto(
  StartSolveSessionRequestSchema,
) {}
