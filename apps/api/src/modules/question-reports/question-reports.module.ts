import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import {
  PublicQuestionReportsController,
  QuestionReportsController,
} from './question-reports.controller';
import { QuestionReportsRepository } from './question-reports.repository';
import { QuestionReportsService } from './question-reports.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestionReportsController, PublicQuestionReportsController],
  providers: [QuestionReportsService, QuestionReportsRepository],
})
export class QuestionReportsModule {}
