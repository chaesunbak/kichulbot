import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { ExamsService } from './exams.service';

@ApiTags('exams')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: '시험 목록 조회' })
  @ApiOkResponse({ description: '시험 목록을 반환합니다.' })
  listExams(@CurrentUser() user: RequestUser) {
    return this.examsService.listExams(user.role);
  }
}
