import type { ListQuestionAttemptsResponse } from '@kichulbot/api-contract/question-attempts';
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
import { ListQuestionAttemptsDto } from './dto/list-question-attempts.dto';
import { QuestionAttemptsService } from './question-attempts.service';

@ApiTags('question-attempts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/question-attempts')
export class QuestionAttemptsController {
  constructor(
    private readonly questionAttemptsService: QuestionAttemptsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '내 문제 풀이 시도 조회' })
  @ApiOkResponse({
    description: '지정한 날짜 범위 안의 문제 풀이 시도를 반환합니다.',
  })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListQuestionAttemptsDto,
  ): Promise<ListQuestionAttemptsResponse> {
    return this.questionAttemptsService.list(user.id, query);
  }
}
