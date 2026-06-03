import { UpdateQuestionRequest } from '@kichulbot/api-contract/questions';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../../../infrastructure/database/prisma-client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { toStringArray } from './transforms';

export class UpdateQuestionDto implements UpdateQuestionRequest {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  number?: number;

  @ApiProperty({ required: false, enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  choiceCount?: number;

  @ApiProperty({ required: false, example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  answerChoice?: number;

  @ApiProperty({ required: false, example: '서술형 모범답안' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  answerText?: string;

  @ApiProperty({ required: false, example: '정답은 3번입니다.' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanation?: string;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  points?: number;

  @ApiProperty({ required: false, example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3600)
  recommendedTimeSeconds?: number;

  @ApiProperty({
    required: false,
    type: [String],
    description: '태그 id 목록. 반복 필드 또는 쉼표 구분 문자열을 허용합니다.',
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
