import { Module } from '@nestjs/common';
import { AnswerSessionsModule } from '../answer-sessions/answer-sessions.module';
import { AuthModule } from '../auth/auth.module';
import {
  ReviewController,
  WrongReviewSessionsController,
} from './review.controller';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

@Module({
  imports: [AuthModule, AnswerSessionsModule],
  controllers: [ReviewController, WrongReviewSessionsController],
  providers: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
