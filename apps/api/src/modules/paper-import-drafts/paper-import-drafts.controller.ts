import {
  BadRequestException,
  Body,
  Controller,
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
import { UserRole } from '../../infrastructure/database/prisma-client';

import {
  PDF_FILES_PIPE,
  PDF_UPLOAD_OPTIONS,
} from '../../common/upload/upload-options';
import { UploadedMemoryFile } from '../../infrastructure/storage/storage.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaperImportDraftsService } from './paper-import-drafts.service';

@ApiTags('paper-import-drafts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('paper-import-drafts')
export class PaperImportDraftsController {
  constructor(
    private readonly paperImportDraftsService: PaperImportDraftsService,
  ) {}

  @Post()
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
