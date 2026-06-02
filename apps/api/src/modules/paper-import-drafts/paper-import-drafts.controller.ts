import {
  Body,
  Controller,
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
import { UserRole } from '@prisma/client';

import { UploadedImageFile } from '../../infrastructure/storage/storage.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaperImportDraftsService } from './paper-import-drafts.service';

const PDF_UPLOAD_OPTIONS = {
  limits: { fileSize: 30 * 1024 * 1024 },
};

type PaperImportFiles = {
  questionPdf?: UploadedImageFile[];
  answerPdf?: UploadedImageFile[];
};

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
    @UploadedFiles() files: PaperImportFiles,
    @Body() body: Record<string, string | undefined>,
  ) {
    return this.paperImportDraftsService.createDraft({
      questionPdf: files.questionPdf?.[0],
      answerPdf: files.answerPdf?.[0],
      options: body,
    });
  }
}
