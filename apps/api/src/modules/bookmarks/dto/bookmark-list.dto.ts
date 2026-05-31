import { CreateBookmarkListRequest } from '@kichulbot/api-contract/bookmarks';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBookmarkListDto implements CreateBookmarkListRequest {
  @ApiProperty({ example: '다시 풀 문제' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/\S/)
  name: string;
}
