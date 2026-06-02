import { CreateExamRequest } from '@kichulbot/api-contract/taxonomy';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateExamDto implements CreateExamRequest {
  @ApiProperty({ example: '수능 한국사' })
  @IsString()
  @MaxLength(50)
  name: string;

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
}
