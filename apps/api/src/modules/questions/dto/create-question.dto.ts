import { CreateQuestionRequest } from '@kichulbot/api-contract/questions';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
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

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(10)
  choiceCount: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  answer: number;

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
