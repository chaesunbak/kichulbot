import { UpdateOfficialTagRequest } from '@kichulbot/api-contract/tags';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOfficialTagDto implements UpdateOfficialTagRequest {
  @ApiProperty({ required: false, example: '조선' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({ required: false, example: 'clx0000000000000000000000' })
  @IsOptional()
  @IsString()
  examId?: string;
}
