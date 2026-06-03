import { AnswerMode } from '../../../infrastructure/database/prisma-client';
import { IsEnum } from 'class-validator';

export class StartBookmarkListSessionDto {
  @IsEnum(AnswerMode)
  mode!: AnswerMode;
}
