import { CreateTagGroupRequest } from '@kichulbot/api-contract/tags';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Allow,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { TagSelectionMode } from '../../../infrastructure/database/prisma-client';

export class CreateTagGroupDto implements CreateTagGroupRequest {
  @ApiProperty({ example: 'clx0000000000000000000000' })
  @IsString()
  examId: string;

  @ApiHideProperty()
  @Allow()
  key?: string;

  @ApiProperty({ example: '시대' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ enum: TagSelectionMode, example: TagSelectionMode.SINGLE })
  @IsEnum(TagSelectionMode)
  selectionMode: TagSelectionMode;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
