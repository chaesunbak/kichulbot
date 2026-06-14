import { CreateTagRequest } from '@kichulbot/api-contract/tags';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTagDto implements CreateTagRequest {
  @ApiProperty({ example: '조선' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['광종', '노비안검법'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiProperty({ example: 'clx0000000000000000000000' })
  @IsString()
  examId: string;

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
