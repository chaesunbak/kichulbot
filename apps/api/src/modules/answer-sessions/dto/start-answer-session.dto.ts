import { AnswerMode } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class StartAnswerSessionDto {
  @IsString()
  @MinLength(1)
  paperId!: string;

  @IsEnum(AnswerMode)
  mode!: AnswerMode;
}
