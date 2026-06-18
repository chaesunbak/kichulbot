import { ListSolveSessionLogsQuerySchema } from '@kichulbot/api-contract/solve-sessions';
import { createZodDto } from 'nestjs-zod';

export class ListSolveSessionLogsDto extends createZodDto(
  ListSolveSessionLogsQuerySchema,
) {}
