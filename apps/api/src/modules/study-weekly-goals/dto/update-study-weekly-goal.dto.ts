import { UpdateStudyWeeklyGoalRequestSchema } from '@kichulbot/api-contract/study-weekly-goals';
import { createZodDto } from 'nestjs-zod';

export class UpdateStudyWeeklyGoalDto extends createZodDto(
  UpdateStudyWeeklyGoalRequestSchema,
) {}
