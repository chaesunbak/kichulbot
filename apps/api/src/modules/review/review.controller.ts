import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { CreateWrongQuestionSetDto } from './dto/create-wrong-question-set.dto';
import { StartWrongReviewSessionDto } from './dto/start-wrong-review-session.dto';
import { ReviewService } from './review.service';

@ApiTags('review')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/wrong-question-sets')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({ summary: '날짜별 오답 세트 조회' })
  @ApiOkResponse({ description: 'studyDate 기준 오답 세트를 반환합니다.' })
  getByStudyDate(
    @CurrentUser() user: RequestUser,
    @Query('studyDate') studyDate?: string,
  ) {
    return this.reviewService.getByStudyDate(user.id, studyDate);
  }

  @Post()
  @ApiOperation({ summary: '날짜별 오답 세트 생성 또는 갱신' })
  @ApiCreatedResponse({
    description: '최신 attempt 기준으로 오답 세트를 생성하거나 갱신합니다.',
  })
  generate(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateWrongQuestionSetDto,
  ) {
    return this.reviewService.generate(user.id, dto.studyDate);
  }

  @Post(':questionSetId/solve-sessions')
  @ApiOperation({ summary: '오답 세트 풀이 세션 시작' })
  @ApiCreatedResponse({ description: '오답 세트 snapshot 풀이를 시작합니다.' })
  start(
    @CurrentUser() user: RequestUser,
    @Param('questionSetId') questionSetId: string,
    @Body() dto: StartWrongReviewSessionDto,
  ) {
    return this.reviewService.start(user.id, questionSetId, dto.mode);
  }
}
