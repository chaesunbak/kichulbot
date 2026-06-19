import type {
  ActiveUsersResponse,
  StudyStreakResponse,
  StudyTimeResponse,
} from '@kichulbot/api-contract/study-activity';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
import { StudyDateDto } from './dto/study-date.dto';
import { StudyActivityService } from './study-activity.service';

@ApiTags('study-activity')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me')
export class MyStudyActivityController {
  constructor(private readonly studyActivityService: StudyActivityService) {}

  @Get('study-streak')
  @ApiOperation({ summary: '내 현재 연속 학습일 조회' })
  @ApiOkResponse({ description: '현재 연속 학습일을 반환합니다.' })
  getStudyStreak(
    @CurrentUser() user: RequestUser,
  ): Promise<StudyStreakResponse> {
    return this.studyActivityService.getStudyStreak(user.id);
  }

  @Get('study-time')
  @ApiOperation({ summary: '내 날짜별 학습 시간 조회' })
  @ApiOkResponse({ description: '지정한 날짜의 학습 시간을 반환합니다.' })
  getStudyTime(
    @CurrentUser() user: RequestUser,
    @Query() query: StudyDateDto,
  ): Promise<StudyTimeResponse> {
    return this.studyActivityService.getStudyTime(user.id, query.date);
  }
}

@ApiTags('study-activity')
@Controller('public')
export class PublicStudyActivityController {
  constructor(private readonly studyActivityService: StudyActivityService) {}

  @Get('active-users')
  @ApiOperation({ summary: '날짜별 학습 활동 사용자 수 조회' })
  @ApiOkResponse({
    description: '지정한 날짜에 학습 활동이 있었던 사용자 수를 반환합니다.',
  })
  getActiveUsers(@Query() query: StudyDateDto): Promise<ActiveUsersResponse> {
    return this.studyActivityService.getActiveUsers(query.date);
  }
}
