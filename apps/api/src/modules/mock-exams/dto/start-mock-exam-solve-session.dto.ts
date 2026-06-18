import { StartMockExamSolveSessionRequestSchema } from '@kichulbot/api-contract/mock-exams';
import { createZodDto } from 'nestjs-zod';

export class StartMockExamSolveSessionDto extends createZodDto(
  StartMockExamSolveSessionRequestSchema,
) {}
