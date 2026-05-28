import { CreatePaperRequest } from '@kichulbot/api-contract/papers';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaperDto implements CreatePaperRequest {
  @ApiProperty({ example: '2025학년도 수능 한국사' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(1994)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 'clx0000000000000000000000' })
  @IsString()
  examId: string;

  @ApiProperty({ example: 'clx0000000000000000000001' })
  @IsString()
  subjectId: string;

  @ApiProperty({ required: false, default: 20, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  questionCount?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
