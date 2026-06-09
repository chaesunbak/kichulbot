import { CreateQuestionRequest } from '@kichulbot/api-contract/questions';
import { ApiProperty } from '@nestjs/swagger';
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

import { QuestionType } from '../../../infrastructure/database/prisma-client';
import { GradingPolicy } from '../../../infrastructure/database/prisma-client';
import { toStringArray } from './transforms';

export class CreateQuestionDto implements CreateQuestionRequest {
  @ApiProperty({ example: 'clx0000000000000000000000' })
  @IsString()
  paperId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  number: number;

  @ApiProperty({
    required: false,
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
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

  @ApiProperty({
    required: false,
    enum: GradingPolicy,
    default: GradingPolicy.EXACT,
  })
  @IsOptional()
  @IsEnum(GradingPolicy)
  gradingPolicy?: GradingPolicy;

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

  @ApiProperty({ required: false, example: '문항 전체 텍스트' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  rawText?: string;

  @ApiProperty({ required: false, example: '문항 발문 텍스트' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  promptText?: string;

  @ApiProperty({ required: false, example: '문항 지문 텍스트' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  passageText?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  choiceTexts?: string[];

  @ApiProperty({ required: false, example: 5, default: 5 })
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
    description: '추천 태그 id 목록. 실제 태그로 연결되지는 않습니다.',
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  recommendedTagIds?: string[];

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
