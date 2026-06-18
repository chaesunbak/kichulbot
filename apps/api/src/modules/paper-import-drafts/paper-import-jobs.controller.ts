import type {
  CreatePaperResponse,
  PaperImportJobPayloadResponse,
  PaperImportJobResponse,
} from '@kichulbot/api-contract/papers';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AdminOrServiceAccountGuard } from '../auth/guards/admin-or-service-account.guard';
import {
  SavePaperImportJobResultDto,
  UpdatePaperImportJobStatusDto,
} from './dto/paper-import-job.dto';
import { PaperImportDraftsService } from './paper-import-drafts.service';

@ApiTags('paper-import-jobs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@ApiForbiddenResponse({ description: '권한이 부족합니다.' })
@Controller('admin/paper-import-jobs')
export class PaperImportJobsController {
  constructor(
    private readonly paperImportDraftsService: PaperImportDraftsService,
  ) {}

  @Get(':id')
  @UseGuards(AdminOrServiceAccountGuard)
  @ApiOperation({ summary: 'PDF 추출 작업 payload 조회' })
  getJobPayload(
    @Param('id') id: string,
  ): Promise<PaperImportJobPayloadResponse> {
    return this.paperImportDraftsService.getImportJobPayload(id);
  }

  @Patch(':id/status')
  @UseGuards(AdminOrServiceAccountGuard)
  @ApiOperation({ summary: 'PDF 추출 작업 상태 변경' })
  updateJobStatus(
    @Param('id') id: string,
    @Body() body: UpdatePaperImportJobStatusDto,
  ): Promise<PaperImportJobResponse> {
    return this.paperImportDraftsService.updateImportJobStatus(id, body);
  }

  @Put(':id/result')
  @UseGuards(AdminOrServiceAccountGuard)
  @ApiOperation({ summary: 'PDF 추출 작업 결과 저장' })
  saveJobResult(
    @Param('id') id: string,
    @Body() body: SavePaperImportJobResultDto,
  ): Promise<PaperImportJobResponse> {
    return this.paperImportDraftsService.saveImportJobResult(id, body);
  }

  @Post(':id/paper')
  @UseGuards(AdminOrServiceAccountGuard)
  @ApiOperation({ summary: 'PDF 추출 결과로 문제지 생성' })
  createPaperFromJob(@Param('id') id: string): Promise<CreatePaperResponse> {
    return this.paperImportDraftsService.createPaperFromImportJob(id);
  }
}
