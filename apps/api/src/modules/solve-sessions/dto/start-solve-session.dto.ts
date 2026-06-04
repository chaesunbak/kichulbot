import { IsEnum, IsString, MinLength } from 'class-validator';

import { AnswerMode } from '../../../infrastructure/database/prisma-client';

export class StartSolveSessionDto {
  @IsString()
  @MinLength(1)
  paperId!: string;

  @IsEnum(AnswerMode)
  mode!: AnswerMode;
}
