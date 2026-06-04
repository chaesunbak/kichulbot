import { StartWrongReviewSessionRequest } from '@kichulbot/api-contract/review';
import { IsEnum, IsOptional } from 'class-validator';

import { AnswerMode } from '../../../infrastructure/database/prisma-client';

export class StartWrongReviewSessionDto implements StartWrongReviewSessionRequest {
  @IsOptional()
  @IsEnum(AnswerMode)
  mode?: AnswerMode;
}
