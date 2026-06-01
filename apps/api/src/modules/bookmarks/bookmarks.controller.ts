import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkListDto } from './dto/bookmark-list.dto';

@ApiTags('question-lists')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/question-lists')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: '내 북마크 리스트 목록 조회' })
  listBookmarkLists(@CurrentUser() user: RequestUser) {
    return this.bookmarksService.listBookmarkLists(user.id);
  }

  @Post()
  @ApiOperation({ summary: '북마크 리스트 생성' })
  @ApiCreatedResponse({ description: '새 북마크 리스트를 생성합니다.' })
  createBookmarkList(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBookmarkListDto,
  ) {
    return this.bookmarksService.createBookmarkList(user.id, dto.name);
  }

  @Get(':bookmarkListId')
  @ApiOperation({ summary: '북마크 리스트 상세 조회' })
  getBookmarkList(
    @CurrentUser() user: RequestUser,
    @Param('bookmarkListId') bookmarkListId: string,
  ) {
    return this.bookmarksService.getBookmarkList(user.id, bookmarkListId);
  }

  @Put(':bookmarkListId/questions/:questionId')
  @ApiOperation({ summary: '리스트에 문제 북마크 추가' })
  @ApiOkResponse({ description: '선택한 리스트에 문제를 추가합니다.' })
  addQuestion(
    @CurrentUser() user: RequestUser,
    @Param('bookmarkListId') bookmarkListId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.bookmarksService.addQuestion(
      user.id,
      bookmarkListId,
      questionId,
    );
  }

  @Delete(':bookmarkListId/questions/:questionId')
  @ApiOperation({ summary: '리스트에서 문제 북마크 제거' })
  @ApiOkResponse({ description: '선택한 리스트에서 문제를 제거합니다.' })
  deleteQuestion(
    @CurrentUser() user: RequestUser,
    @Param('bookmarkListId') bookmarkListId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.bookmarksService.deleteQuestion(
      user.id,
      bookmarkListId,
      questionId,
    );
  }
}
