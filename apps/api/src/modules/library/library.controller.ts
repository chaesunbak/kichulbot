import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { CreateBookshelfDto, UpdateBookshelfDto } from './dto/bookshelf.dto';
import { LibraryService } from './library.service';

@ApiTags('library')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('library/bookshelves')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  @ApiOperation({ summary: '내 책장 목록 조회' })
  @ApiOkResponse({ description: '내 책장과 추가한 문제지를 반환합니다.' })
  listBookshelves(@CurrentUser() user: RequestUser) {
    return this.libraryService.listBookshelves(user.id);
  }

  @Post()
  @ApiOperation({ summary: '책장 생성' })
  @ApiCreatedResponse({ description: '새 책장을 생성합니다.' })
  createBookshelf(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBookshelfDto,
  ) {
    return this.libraryService.createBookshelf(user.id, dto.name);
  }

  @Patch(':bookshelfId')
  @ApiOperation({ summary: '책장 이름 변경' })
  @ApiOkResponse({ description: '책장 이름을 변경합니다.' })
  updateBookshelf(
    @CurrentUser() user: RequestUser,
    @Param('bookshelfId') bookshelfId: string,
    @Body() dto: UpdateBookshelfDto,
  ) {
    return this.libraryService.updateBookshelf(user.id, bookshelfId, dto.name);
  }

  @Delete(':bookshelfId')
  @ApiOperation({ summary: '책장 삭제' })
  @ApiOkResponse({ description: '책장과 책장 안의 문제지를 제거합니다.' })
  deleteBookshelf(
    @CurrentUser() user: RequestUser,
    @Param('bookshelfId') bookshelfId: string,
  ) {
    return this.libraryService.deleteBookshelf(user.id, bookshelfId);
  }

  @Post(':bookshelfId/papers/:paperId')
  @ApiOperation({ summary: '책장에 문제지 추가' })
  @ApiCreatedResponse({ description: '선택한 책장에 문제지를 추가합니다.' })
  addPaper(
    @CurrentUser() user: RequestUser,
    @Param('bookshelfId') bookshelfId: string,
    @Param('paperId') paperId: string,
  ) {
    return this.libraryService.addPaper(user.id, bookshelfId, paperId);
  }

  @Delete(':bookshelfId/papers/:paperId')
  @ApiOperation({ summary: '책장에서 문제지 제거' })
  @ApiOkResponse({ description: '선택한 책장에서 문제지를 제거합니다.' })
  deletePaper(
    @CurrentUser() user: RequestUser,
    @Param('bookshelfId') bookshelfId: string,
    @Param('paperId') paperId: string,
  ) {
    return this.libraryService.deletePaper(user.id, bookshelfId, paperId);
  }
}
