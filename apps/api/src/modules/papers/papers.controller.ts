import type {
  AdminGetPaperResponse,
  AdminListPaperQuestionsResponse,
  AdminListPapersResponse,
  CreatePaperResponse,
  DeletePaperResponse,
  PublicGetPaperResponse,
  PublicListPaperQuestionsResponse,
  PublicListPapersResponse,
  UpdatePaperResponse,
} from '@kichulbot/api-contract/papers';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  IMAGE_FILE_PIPE,
  IMAGE_UPLOAD_OPTIONS,
} from '../../common/pipes/upload-file.pipe';
import { UserRole } from '../../infrastructure/database/prisma-client';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestUser } from '../auth/types';
import { CreatePaperDto } from './dto/create-paper.dto';
import { UpdatePaperDto } from './dto/update-paper.dto';
import { PapersService } from './papers.service';

@ApiTags('exam-papers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/exam-papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Get()
  @ApiOperation({
    summary: '관리자 문제지 목록 조회',
    description: '관리자는 모든 문제지를 조회합니다.',
  })
  @ApiOkResponse({ description: '문제지 목록을 반환합니다.' })
  @ApiForbiddenResponse({
    description: '관리자만 문제지를 조회할 수 있습니다.',
  })
  listPapers(
    @CurrentUser() user: RequestUser,
    @Query('examId') examId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
  ): Promise<AdminListPapersResponse> {
    return this.papersService.listAdminPapers(user.id, {
      examId,
      categoryId,
      q,
    });
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 100, IMAGE_UPLOAD_OPTIONS))
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: CreatePaperDto })
  @ApiOperation({ summary: '문제지 생성' })
  @ApiCreatedResponse({ description: '문제지를 생성합니다.' })
  @ApiForbiddenResponse({
    description: '관리자만 문제지를 생성할 수 있습니다.',
  })
  createPaper(
    @CurrentUser() user: RequestUser,
    @Body() body: CreatePaperDto & { payload?: string },
    @UploadedFiles(IMAGE_FILE_PIPE) images: UploadedMemoryFile[] = [],
  ): Promise<CreatePaperResponse> {
    if (body.payload) {
      return this.papersService.createPaperWithQuestions(
        body.payload,
        images,
        user.role,
      );
    }
    return this.papersService.createPaper(body, user.role);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: '문제지 문항 목록 조회' })
  @ApiOkResponse({ description: '문제지의 문항 목록을 반환합니다.' })
  listPaperQuestions(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<AdminListPaperQuestionsResponse> {
    return this.papersService.listAdminPaperQuestions(id, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: '관리자 문제지 상세 조회',
    description: '관리자는 비공개 문제지도 조회합니다.',
  })
  @ApiOkResponse({ description: '문제지 상세를 반환합니다.' })
  getPaper(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<AdminGetPaperResponse> {
    return this.papersService.getAdminPaper(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '문제지 공개 상태 변경' })
  @ApiOkResponse({ description: '문제지 공개 상태를 변경합니다.' })
  updatePaper(
    @Param('id') id: string,
    @Body() dto: UpdatePaperDto,
  ): Promise<UpdatePaperResponse> {
    return this.papersService.updatePaper(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '문제지 삭제' })
  @ApiOkResponse({ description: '문제지를 삭제합니다.' })
  deletePaper(@Param('id') id: string): Promise<DeletePaperResponse> {
    return this.papersService.deletePaper(id);
  }
}

@ApiTags('exam-papers')
@Controller('public/exam-papers')
export class PublicPapersController {
  constructor(private readonly papersService: PapersService) {}

  @Get()
  @ApiOperation({ summary: '공개 문제지 목록 조회' })
  @ApiOkResponse({ description: '공개된 문제지 목록을 반환합니다.' })
  listPapers(
    @Query('examId') examId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
  ): Promise<PublicListPapersResponse> {
    return this.papersService.listPublicPapers(undefined, {
      examId,
      categoryId,
      q,
    });
  }

  @Get(':id/questions')
  @ApiOperation({ summary: '공개 문제지 문항 목록 조회' })
  @ApiOkResponse({ description: '공개된 문제지의 문항 목록을 반환합니다.' })
  listPaperQuestions(
    @Param('id') id: string,
  ): Promise<PublicListPaperQuestionsResponse> {
    return this.papersService.listPublicPaperQuestions(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '공개 문제지 상세 조회' })
  @ApiOkResponse({ description: '공개된 문제지 상세를 반환합니다.' })
  getPaper(@Param('id') id: string): Promise<PublicGetPaperResponse> {
    return this.papersService.getPublicPaper(id);
  }
}
