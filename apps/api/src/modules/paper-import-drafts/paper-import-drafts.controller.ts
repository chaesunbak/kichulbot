import type {
  CreatePaperImportJobResponse,
  ListPaperImportJobsResponse,
  PaperImportJobResponse,
} from '@kichulbot/api-contract/papers';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { PDF_UPLOAD_OPTIONS } from '../../common/pipes/upload-file.pipe';
import { UserRole } from '../../infrastructure/database/prisma-client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaperImportDraftsService } from './paper-import-drafts.service';
import {
  PAPER_IMPORT_DRAFT_FILES_PIPE,
  PaperImportDraftFiles,
} from './pipes/paper-import-draft-files.pipe';

@ApiTags('paper-import-drafts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
@Controller('admin/paper-import-drafts')
export class PaperImportDraftsController {
  constructor(
    private readonly paperImportDraftsService: PaperImportDraftsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'questionPdf', maxCount: 1 },
        { name: 'answerPdf', maxCount: 1 },
      ],
      PDF_UPLOAD_OPTIONS,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '문제 PDF와 답지 PDF에서 문항 초안 추출' })
  createDraft(
    @UploadedFiles(PAPER_IMPORT_DRAFT_FILES_PIPE)
    files: PaperImportDraftFiles = {},
    @Body() body: Record<string, string | undefined>,
  ): Promise<CreatePaperImportJobResponse> {
    return this.paperImportDraftsService.createDraft({
      questionPdf: files.questionPdf,
      answerPdf: files.answerPdf,
      options: body,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'PDF 가져오기 작업 목록 조회' })
  listDraftJobs(): Promise<ListPaperImportJobsResponse> {
    return this.paperImportDraftsService.listDraftJobs();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'PDF 추출 작업 상태 조회' })
  getDraftJob(@Param('id') id: string): Promise<PaperImportJobResponse> {
    return this.paperImportDraftsService.getDraftJob(id);
  }
}
