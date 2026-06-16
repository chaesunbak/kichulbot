import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  PDF_FILES_PIPE,
  PDF_UPLOAD_OPTIONS,
} from '../../common/upload/upload-options';
import { UserRole } from '../../infrastructure/database/prisma-client';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceAccountScopes } from '../auth/decorators/service-account-scopes.decorator';
import { AdminOrServiceAccountGuard } from '../auth/guards/admin-or-service-account.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaperImportDraftsService } from './paper-import-drafts.service';

@ApiTags('paper-import-drafts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
@Controller('paper-import-drafts')
export class PaperImportDraftsController {
  constructor(
    private readonly paperImportDraftsService: PaperImportDraftsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(AnyFilesInterceptor(PDF_UPLOAD_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '문제 PDF와 답지 PDF에서 문항 초안 추출' })
  createDraft(
    @UploadedFiles(PDF_FILES_PIPE) files: UploadedMemoryFile[] = [],
    @Body() body: Record<string, string | undefined>,
  ) {
    this.assertAllowedFields(files);

    return this.paperImportDraftsService.createDraft({
      questionPdf: this.getSingleFile(files, 'questionPdf', '문제 PDF'),
      answerPdf: this.getSingleFile(files, 'answerPdf', '답지 PDF'),
      options: body,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'PDF 가져오기 작업 목록 조회' })
  listDraftJobs() {
    return this.paperImportDraftsService.listDraftJobs();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'PDF 추출 작업 상태 조회' })
  getDraftJob(@Param('id') id: string) {
    return this.paperImportDraftsService.getDraftJob(id);
  }

  @Post(':id/publish')
  @UseGuards(AdminOrServiceAccountGuard)
  @ServiceAccountScopes('paper-import:publish')
  @ApiOperation({ summary: 'PDF 추출 초안으로 문제지 생성' })
  publishDraftJob(@Param('id') id: string) {
    return this.paperImportDraftsService.publishDraftJob(id);
  }

  private assertAllowedFields(files: UploadedMemoryFile[]) {
    const allowedFields = new Set(['questionPdf', 'answerPdf']);
    const unexpectedFile = files.find(
      (file) => !file.fieldname || !allowedFields.has(file.fieldname),
    );

    if (unexpectedFile) {
      throw new BadRequestException('지원하지 않는 업로드 필드입니다.');
    }
  }

  private getSingleFile(
    files: UploadedMemoryFile[],
    fieldName: string,
    label: string,
  ) {
    const matchedFiles = files.filter((file) => file.fieldname === fieldName);
    if (matchedFiles.length > 1) {
      throw new BadRequestException(`${label}는 1개만 업로드할 수 있습니다.`);
    }

    return matchedFiles[0];
  }
}
