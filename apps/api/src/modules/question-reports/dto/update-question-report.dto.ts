import { UpdateQuestionReportRequestSchema } from '@kichulbot/api-contract/question-reports';
import { createZodDto } from 'nestjs-zod';

export class UpdateQuestionReportDto extends createZodDto(
  UpdateQuestionReportRequestSchema,
) {}
