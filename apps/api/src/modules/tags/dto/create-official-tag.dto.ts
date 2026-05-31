import { CreateOfficialTagRequest } from '@kichulbot/api-contract/tags';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MaxLength } from 'class-validator';

export class CreateOfficialTagDto implements CreateOfficialTagRequest {
  @ApiProperty({ example: '조선' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'joseon' })
  @IsString()
  @MaxLength(50)
  slug: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];
}
