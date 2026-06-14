import { StartMockExamSolveSessionRequest } from '@kichulbot/api-contract/mock-exams';
import { IsEnum, IsString, MinLength } from 'class-validator';

import { AnswerMode } from '../../../infrastructure/database/prisma-client';

export class StartMockExamSolveSessionDto implements StartMockExamSolveSessionRequest {
  @IsString()
  @MinLength(1)
  examId!: string;

  @IsEnum(AnswerMode)
  mode!: AnswerMode;
}
