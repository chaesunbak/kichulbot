import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import {
  AddLibraryPaperDto,
  CreateLibraryFolderDto,
  MoveLibraryPaperDto,
  UpdateLibraryFolderDto,
} from './dto/library.dto';
import { LibraryService } from './library.service';

@ApiTags('library')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  @ApiOperation({ summary: '내 서재 조회' })
  @ApiOkResponse({ description: '내 서재 폴더와 저장한 문제지를 반환합니다.' })
  getLibrary(@CurrentUser() user: RequestUser) {
    return this.libraryService.getLibrary(user.id);
  }

  @Post('folders')
  @ApiOperation({ summary: '내 서재 폴더 생성' })
  @ApiCreatedResponse({ description: '새 폴더를 생성합니다.' })
  createFolder(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateLibraryFolderDto,
  ) {
    return this.libraryService.createFolder(user.id, dto);
  }

  @Patch('folders/:folderId')
  @ApiOperation({ summary: '내 서재 폴더 변경' })
  @ApiOkResponse({ description: '폴더 이름 또는 위치를 변경합니다.' })
  updateFolder(
    @CurrentUser() user: RequestUser,
    @Param('folderId') folderId: string,
    @Body() dto: UpdateLibraryFolderDto,
  ) {
    return this.libraryService.updateFolder(user.id, folderId, dto);
  }

  @Delete('folders/:folderId')
  @ApiOperation({ summary: '내 서재 폴더 삭제' })
  @ApiOkResponse({ description: '빈 폴더를 삭제합니다.' })
  deleteFolder(
    @CurrentUser() user: RequestUser,
    @Param('folderId') folderId: string,
  ) {
    return this.libraryService.deleteFolder(user.id, folderId);
  }

  @Put('exam-papers/:paperId')
  @ApiOperation({ summary: '내 서재에 문제지 추가' })
  @ApiOkResponse({
    description: '내 서재 또는 선택한 폴더에 문제지를 추가합니다.',
  })
  addPaper(
    @CurrentUser() user: RequestUser,
    @Param('paperId') paperId: string,
    @Body() dto: AddLibraryPaperDto,
  ) {
    return this.libraryService.addPaper(user.id, paperId, dto.folderId ?? null);
  }

  @Patch('papers/:libraryPaperId')
  @ApiOperation({ summary: '저장한 문제지 이동' })
  @ApiOkResponse({
    description: '저장한 문제지를 다른 폴더나 루트로 이동합니다.',
  })
  movePaper(
    @CurrentUser() user: RequestUser,
    @Param('libraryPaperId') libraryPaperId: string,
    @Body() dto: MoveLibraryPaperDto,
  ) {
    return this.libraryService.movePaper(
      user.id,
      libraryPaperId,
      dto.folderId ?? null,
    );
  }

  @Delete('papers/:libraryPaperId')
  @ApiOperation({ summary: '내 서재에서 문제지 제거' })
  @ApiOkResponse({ description: '저장한 문제지를 제거합니다.' })
  deletePaper(
    @CurrentUser() user: RequestUser,
    @Param('libraryPaperId') libraryPaperId: string,
  ) {
    return this.libraryService.deletePaper(user.id, libraryPaperId);
  }
}
