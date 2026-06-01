import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnswerSessionsController } from './answer-sessions.controller';
import { AnswerSessionsRepository } from './answer-sessions.repository';
import { AnswerSessionsService } from './answer-sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [AnswerSessionsController],
  providers: [AnswerSessionsService, AnswerSessionsRepository],
  exports: [AnswerSessionsService],
})
export class AnswerSessionsModule {}
