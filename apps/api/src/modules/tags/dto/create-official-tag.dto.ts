import { CreateOfficialTagRequest } from '@kichulbot/api-contract/tags';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateOfficialTagDto implements CreateOfficialTagRequest {
  @ApiProperty({ example: '조선' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'clx0000000000000000000000' })
  @IsString()
  examId: string;
}
