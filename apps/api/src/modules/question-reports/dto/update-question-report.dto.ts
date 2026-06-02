import { UpdateQuestionReportRequest } from '@kichulbot/api-contract/question-reports';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionReportStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQuestionReportDto implements UpdateQuestionReportRequest {
  @ApiProperty({ required: false, enum: QuestionReportStatus })
  @IsOptional()
  @IsEnum(QuestionReportStatus)
  status?: QuestionReportStatus;

  @ApiProperty({ required: false, example: '정답을 4번으로 수정 완료' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  adminMemo?: string | null;
}
