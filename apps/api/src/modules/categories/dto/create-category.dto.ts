import { CreateCategoryRequest } from '@kichulbot/api-contract/taxonomy';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto implements CreateCategoryRequest {
  @ApiProperty({ example: '수능' })
  @IsString()
  @MaxLength(50)
  name: string;
}
