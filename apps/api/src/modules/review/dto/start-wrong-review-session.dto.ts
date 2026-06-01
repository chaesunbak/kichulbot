import { StartWrongReviewSessionRequest } from '@kichulbot/api-contract/review';
import { AnswerMode } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class StartWrongReviewSessionDto implements StartWrongReviewSessionRequest {
  @IsOptional()
  @IsEnum(AnswerMode)
  mode?: AnswerMode;
}
