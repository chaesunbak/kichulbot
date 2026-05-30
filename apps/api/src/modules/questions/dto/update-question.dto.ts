import { UpdateQuestionRequest } from '@kichulbot/api-contract/questions';
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

export class UpdateQuestionDto implements UpdateQuestionRequest {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  number?: number;

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
  answer?: number;

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
