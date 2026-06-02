import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { QuestionAttemptsController } from './question-attempts.controller';
import { QuestionAttemptsRepository } from './question-attempts.repository';
import { QuestionAttemptsService } from './question-attempts.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestionAttemptsController],
  providers: [QuestionAttemptsService, QuestionAttemptsRepository],
})
export class QuestionAttemptsModule {}
