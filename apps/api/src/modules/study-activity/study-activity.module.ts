import { Module } from '@nestjs/common';

import {
  MyStudyActivityController,
  PublicStudyActivityController,
} from './study-activity.controller';
import { StudyActivityRepository } from './study-activity.repository';
import { StudyActivityService } from './study-activity.service';

@Module({
  controllers: [MyStudyActivityController, PublicStudyActivityController],
  providers: [StudyActivityService, StudyActivityRepository],
})
export class StudyActivityModule {}
