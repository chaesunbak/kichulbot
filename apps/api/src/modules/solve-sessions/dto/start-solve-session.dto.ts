import { AnswerMode } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class StartSolveSessionDto {
  @IsString()
  @MinLength(1)
  paperId!: string;

  @IsEnum(AnswerMode)
  mode!: AnswerMode;
}
