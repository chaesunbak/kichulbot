import { ListAdminQuestionReportsQuery } from '@kichulbot/api-contract/question-reports';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  QuestionReportCategory,
  QuestionReportStatus,
} from '../../../infrastructure/database/prisma-client';

export class ListQuestionReportsDto
  extends PaginationDto
  implements ListAdminQuestionReportsQuery
{
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
}
