import { StudyDateQuerySchema } from '@kichulbot/api-contract/study-activity';
import { createZodDto } from 'nestjs-zod';

export class StudyDateDto extends createZodDto(StudyDateQuerySchema) {}
