import type { StudyWeeklyGoalResponseEnvelope } from '@kichulbot/api-contract/study-weekly-goals';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
import { UpdateStudyWeeklyGoalDto } from './dto/update-study-weekly-goal.dto';
import { StudyWeeklyGoalsService } from './study-weekly-goals.service';

@ApiTags('study-weekly-goals')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/study-weekly-goals')
export class StudyWeeklyGoalsController {
  constructor(
    private readonly studyWeeklyGoalsService: StudyWeeklyGoalsService,
  ) {}

  @Get('current')
  @ApiOperation({ summary: '현재 주간 학습 목표 조회' })
  @ApiOkResponse({
    description: '현재 주에 적용되는 주간 학습 목표를 반환합니다.',
  })
  getCurrent(
    @CurrentUser() user: RequestUser,
  ): Promise<StudyWeeklyGoalResponseEnvelope> {
    return this.studyWeeklyGoalsService.getCurrent(user.id);
  }

  @Patch('current')
  @ApiOperation({ summary: '현재 주간 학습 목표 수정' })
  @ApiOkResponse({
    description: '현재 주에 적용할 주간 학습 목표를 저장하고 반환합니다.',
  })
  updateCurrent(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateStudyWeeklyGoalDto,
  ): Promise<StudyWeeklyGoalResponseEnvelope> {
    return this.studyWeeklyGoalsService.updateCurrent(user.id, dto.targetDays);
  }
}
