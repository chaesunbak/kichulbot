import {
  CreateBookshelfRequest,
  UpdateBookshelfRequest,
} from '@kichulbot/api-contract/library';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBookshelfDto implements CreateBookshelfRequest {
  @ApiProperty({ example: '한국사 오답 노트' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/\S/)
  name: string;
}

export class UpdateBookshelfDto implements UpdateBookshelfRequest {
  @ApiProperty({ example: '다시 풀 문제지' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/\S/)
  name: string;
}
