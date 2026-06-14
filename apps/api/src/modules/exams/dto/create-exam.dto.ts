import { CreateExamRequest } from '@kichulbot/api-contract/taxonomy';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class MockExamBlueprintItemDto {
  @IsString()
  tagId: string;

  @IsInt()
  @Min(0)
  @Max(100)
  minQuestionCount: number;

  @IsInt()
  @Min(0)
  @Max(100)
  maxQuestionCount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateExamDto implements CreateExamRequest {
  @ApiProperty({ example: '수능 한국사' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'korean-history-advanced' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: '시험 슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.',
  })
  slug: string;

  @ApiProperty({
    example: ['clx0000000000000000000000'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  usesMonth?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  usesRound?: boolean;

  @ApiProperty({ required: false, nullable: true, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  mockExamQuestionCount?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  eraTagGroupId?: string | null;

  @ApiProperty({
    required: false,
    type: [MockExamBlueprintItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MockExamBlueprintItemDto)
  mockExamBlueprintItems?: MockExamBlueprintItemDto[];
}
