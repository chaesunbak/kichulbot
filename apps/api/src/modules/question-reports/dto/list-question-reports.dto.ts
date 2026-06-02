import { ListAdminQuestionReportsQuery } from '@kichulbot/api-contract/question-reports';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionReportCategory, QuestionReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListQuestionReportsDto implements ListAdminQuestionReportsQuery {
  @ApiProperty({ required: false, enum: QuestionReportStatus })
  @IsOptional()
  @IsEnum(QuestionReportStatus)
  status?: QuestionReportStatus;

  @ApiProperty({ required: false, enum: QuestionReportCategory })
  @IsOptional()
  @IsEnum(QuestionReportCategory)
  category?: QuestionReportCategory;

  @ApiProperty({ required: false, example: 'clx0000000000000000000000' })
  @IsOptional()
  @IsString()
  questionId?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
