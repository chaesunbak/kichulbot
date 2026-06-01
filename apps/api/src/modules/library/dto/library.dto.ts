import {
  AddLibraryPaperRequest,
  CreateLibraryFolderRequest,
  MoveLibraryPaperRequest,
  UpdateLibraryFolderRequest,
} from '@kichulbot/api-contract/library';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLibraryFolderDto implements CreateLibraryFolderRequest {
  @ApiProperty({ example: '한국사 오답 노트' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/\S/)
  name: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}

export class UpdateLibraryFolderDto implements UpdateLibraryFolderRequest {
  @ApiPropertyOptional({ example: '다시 풀 문제지' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/\S/)
  name?: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @IsString()
  parentId?: string | null;
}

export class AddLibraryPaperDto implements AddLibraryPaperRequest {
  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @IsString()
  folderId?: string | null;
}

export class MoveLibraryPaperDto implements MoveLibraryPaperRequest {
  @ApiProperty({ nullable: true, example: null })
  @IsOptional()
  @IsString()
  folderId: string | null;
}
