import { ListAdminQuestionReportsQuerySchema } from '@kichulbot/api-contract/question-reports';
import { createZodDto } from 'nestjs-zod';

export class ListQuestionReportsDto extends createZodDto(
  ListAdminQuestionReportsQuerySchema,
) {}
