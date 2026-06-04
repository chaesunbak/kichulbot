import { IsEnum } from 'class-validator';

import { AnswerMode } from '../../../infrastructure/database/prisma-client';

export class StartBookmarkListSessionDto {
  @IsEnum(AnswerMode)
  mode!: AnswerMode;
}
