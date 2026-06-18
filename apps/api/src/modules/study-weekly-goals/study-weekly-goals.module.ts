import { Module } from '@nestjs/common';

import { StudyWeeklyGoalsController } from './study-weekly-goals.controller';
import { StudyWeeklyGoalsRepository } from './study-weekly-goals.repository';
import { StudyWeeklyGoalsService } from './study-weekly-goals.service';

@Module({
  controllers: [StudyWeeklyGoalsController],
  providers: [StudyWeeklyGoalsService, StudyWeeklyGoalsRepository],
})
export class StudyWeeklyGoalsModule {}
