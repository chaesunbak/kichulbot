import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { StartWrongReviewSessionDto } from './dto/start-wrong-review-session.dto';
import { ReviewService } from './review.service';

@ApiTags('review')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('wrong-questions')
  @ApiOperation({ summary: '오늘의 오답 문제지 조회' })
  @ApiOkResponse({ description: '사용자 timezone 기준 오늘의 오답입니다.' })
  getToday(@CurrentUser() user: RequestUser) {
    return this.reviewService.getToday(user.id);
  }

  @Post('wrong-question-sets/today/refresh')
  @ApiOperation({ summary: '오늘의 오답 문제지 명시적 갱신' })
  @ApiCreatedResponse({ description: '최신 attempt 기준으로 갱신합니다.' })
  refreshToday(@CurrentUser() user: RequestUser) {
    return this.reviewService.refreshToday(user.id);
  }
}

@ApiTags('review')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('answer-sessions')
export class WrongReviewSessionsController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('wrong-review')
  @ApiOperation({ summary: '오늘의 오답 복습 세션 시작' })
  @ApiCreatedResponse({ description: '오답 세트 snapshot 풀이를 시작합니다.' })
  startToday(
    @CurrentUser() user: RequestUser,
    @Body() dto: StartWrongReviewSessionDto,
  ) {
    return this.reviewService.startToday(user.id, dto.mode);
  }
}
