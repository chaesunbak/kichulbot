import { CreateQuestionReportRequestSchema } from '@kichulbot/api-contract/question-reports';
import { createZodDto } from 'nestjs-zod';

export class CreateQuestionReportDto extends createZodDto(
  CreateQuestionReportRequestSchema,
) {}
