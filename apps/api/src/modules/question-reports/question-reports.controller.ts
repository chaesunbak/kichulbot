import {
  Body,
  Controller,
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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestUser } from '../auth/types';
import { CreateQuestionReportDto } from './dto/create-question-report.dto';
import { ListQuestionReportsDto } from './dto/list-question-reports.dto';
import { UpdateQuestionReportDto } from './dto/update-question-report.dto';
import { QuestionReportsService } from './question-reports.service';

@ApiTags('question-reports')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class QuestionReportsController {
  constructor(
    private readonly questionReportsService: QuestionReportsService,
  ) {}

  @Post('question-reports/:questionId')
  @ApiOperation({ summary: '문항 신고 생성' })
  @ApiCreatedResponse({ description: '문항 신고를 생성합니다.' })
  createQuestionReport(
    @CurrentUser() user: RequestUser,
    @Param('questionId') questionId: string,
    @Body() dto: CreateQuestionReportDto,
  ) {
    return this.questionReportsService.create(user.id, questionId, dto);
  }

  @Get('admin/question-reports')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '관리자 문항 신고 목록 조회' })
  @ApiOkResponse({ description: '문항 신고 목록을 조회합니다.' })
  @ApiForbiddenResponse({
    description: '관리자만 문항 신고를 조회할 수 있습니다.',
  })
  listAdminQuestionReports(@Query() query: ListQuestionReportsDto) {
    return this.questionReportsService.listAdmin(query);
  }

  @Patch('admin/question-reports/:reportId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '관리자 문항 신고 처리' })
  @ApiOkResponse({ description: '문항 신고 처리 상태를 변경합니다.' })
  @ApiForbiddenResponse({
    description: '관리자만 문항 신고를 처리할 수 있습니다.',
  })
  updateAdminQuestionReport(
    @CurrentUser() user: RequestUser,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateQuestionReportDto,
  ) {
    return this.questionReportsService.updateAdmin(reportId, user.id, dto);
  }
}

@ApiTags('question-reports')
@Controller('public/question-reports')
export class PublicQuestionReportsController {
  constructor(
    private readonly questionReportsService: QuestionReportsService,
  ) {}

  @Post(':questionId')
  @ApiOperation({ summary: '비로그인 문항 신고 생성' })
  @ApiCreatedResponse({ description: '문항 신고를 생성합니다.' })
  createQuestionReport(
    @Param('questionId') questionId: string,
    @Body() dto: CreateQuestionReportDto,
  ) {
    return this.questionReportsService.create(null, questionId, dto);
  }
}
