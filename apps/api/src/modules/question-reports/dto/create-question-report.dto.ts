import { CreateQuestionReportRequest } from '@kichulbot/api-contract/question-reports';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionReportCategory } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuestionReportDto implements CreateQuestionReportRequest {
  @ApiProperty({ enum: QuestionReportCategory })
  @IsEnum(QuestionReportCategory)
  category!: QuestionReportCategory;

  @ApiProperty({
    example: '정답이 3번으로 표시되어 있는데 실제 정답은 4번 같습니다.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ required: false, example: 'clx0000000000000000000000' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  questionRevisionId?: string;
}
