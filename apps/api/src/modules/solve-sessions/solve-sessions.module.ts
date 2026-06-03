import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import {
  PublicSolveSessionsController,
  SolveSessionsController,
} from './solve-sessions.controller';
import { SolveSessionsRepository } from './solve-sessions.repository';
import { SolveSessionsService } from './solve-sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [SolveSessionsController, PublicSolveSessionsController],
  providers: [SolveSessionsService, SolveSessionsRepository],
  exports: [SolveSessionsService],
})
export class SolveSessionsModule {}
