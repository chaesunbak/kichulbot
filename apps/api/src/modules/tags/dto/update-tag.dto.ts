import { UpdateTagRequest } from '@kichulbot/api-contract/tags';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateTagDto implements UpdateTagRequest {
  @ApiProperty({ required: false, example: '조선' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['광종', '노비안검법'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiProperty({ required: false, example: 'clx0000000000000000000000' })
  @IsOptional()
  @IsString()
  examId?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'clx0000000000000000000001',
  })
  @IsOptional()
  @IsString()
  tagGroupId?: string | null;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
