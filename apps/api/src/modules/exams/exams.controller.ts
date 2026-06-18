import type {
  AdminListExamsResponse,
  DeleteExamResponse,
  ExamMutationResponse,
  ListExamPaperOverviewsResponse,
  PublicListExamsResponse,
} from '@kichulbot/api-contract/taxonomy';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserRole } from '../../infrastructure/database/prisma-client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { ExamsService } from './exams.service';

@ApiTags('exams')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: '관리자 시험 목록 조회' })
  @ApiOkResponse({ description: '시험 목록을 반환합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  listExams(): Promise<AdminListExamsResponse> {
    return this.examsService.listAdminExams();
  }

  @Post()
  @ApiOperation({ summary: '시험 생성' })
  @ApiCreatedResponse({ description: '시험을 생성합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  createExam(@Body() dto: CreateExamDto): Promise<ExamMutationResponse> {
    return this.examsService.createExam(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '시험 수정' })
  @ApiOkResponse({ description: '시험을 수정합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  updateExam(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
  ): Promise<ExamMutationResponse> {
    return this.examsService.updateExam(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '시험 삭제' })
  @ApiOkResponse({ description: '연결된 문제지가 없는 시험을 삭제합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  deleteExam(@Param('id') id: string): Promise<DeleteExamResponse> {
    return this.examsService.deleteExam(id);
  }
}

@ApiTags('exams')
@Controller('public/exams')
export class PublicExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: '공개 시험 목록 조회' })
  @ApiOkResponse({ description: '시험 목록을 반환합니다.' })
  listExams(): Promise<PublicListExamsResponse> {
    return this.examsService.listPublicExams();
  }

  @Get('paper-overviews')
  @ApiOperation({ summary: '공개 시험별 문제지 미리보기 조회' })
  @ApiOkResponse({
    description: '시험별 공개 문제지 개수와 미리보기 목록을 반환합니다.',
  })
  listPaperOverviews(
    @Query('paperLimit') paperLimit?: string,
  ): Promise<ListExamPaperOverviewsResponse> {
    return this.examsService.listPublicPaperOverviews({ paperLimit });
  }
}
