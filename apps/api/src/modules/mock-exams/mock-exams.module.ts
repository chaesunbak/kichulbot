import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SolveSessionsModule } from '../solve-sessions/solve-sessions.module';
import { MockExamsController } from './mock-exams.controller';
import { MockExamsRepository } from './mock-exams.repository';
import { MockExamsService } from './mock-exams.service';

@Module({
  imports: [AuthModule, SolveSessionsModule],
  controllers: [MockExamsController],
  providers: [MockExamsService, MockExamsRepository],
})
export class MockExamsModule {}
