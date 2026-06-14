import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { StartMockExamSolveSessionDto } from './dto/start-mock-exam-solve-session.dto';
import { MockExamsService } from './mock-exams.service';

@ApiTags('mock-exams')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/mock-exams')
export class MockExamsController {
  constructor(private readonly mockExamsService: MockExamsService) {}

  @Post('solve-sessions')
  @ApiOperation({ summary: '모의고사 생성 후 풀이 세션 시작' })
  @ApiCreatedResponse({
    description: '시험별 모의고사 구성표에 맞춰 풀이 세션을 시작합니다.',
  })
  startSolveSession(
    @CurrentUser() user: RequestUser,
    @Body() dto: StartMockExamSolveSessionDto,
  ) {
    return this.mockExamsService.startSolveSession(
      user.id,
      dto.examId,
      dto.mode,
    );
  }
}
