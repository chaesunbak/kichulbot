import { Module } from '@nestjs/common';
import { SolveSessionsModule } from '../solve-sessions/solve-sessions.module';
import { AuthModule } from '../auth/auth.module';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

@Module({
  imports: [AuthModule, SolveSessionsModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
