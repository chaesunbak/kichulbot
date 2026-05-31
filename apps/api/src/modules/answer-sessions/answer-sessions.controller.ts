import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { AnswerSessionsService } from './answer-sessions.service';
import { SaveDraftAnswerDto } from './dto/save-draft-answer.dto';
import { StartAnswerSessionDto } from './dto/start-answer-session.dto';

@ApiTags('answer-sessions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('answer-sessions')
export class AnswerSessionsController {
  constructor(private readonly answerSessionsService: AnswerSessionsService) {}

  @Get()
  @ApiOperation({ summary: '내 풀이 로그 조회' })
  @ApiOkResponse({ description: '종료한 풀이 로그를 반환합니다.' })
  listLogs(@CurrentUser() user: RequestUser) {
    return this.answerSessionsService.listLogs(user.id);
  }

  @Post()
  @ApiOperation({ summary: '문제지 풀이 세션 시작' })
  @ApiCreatedResponse({ description: '기존 세션 또는 새 세션을 반환합니다.' })
  start(@CurrentUser() user: RequestUser, @Body() dto: StartAnswerSessionDto) {
    return this.answerSessionsService.start(user.id, dto.paperId, dto.mode);
  }

  @Get(':id')
  @ApiOperation({ summary: '문제지 풀이 데이터 조회' })
  @ApiOkResponse({ description: '문항과 저장된 임시 답안을 반환합니다.' })
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.answerSessionsService.get(user.id, id);
  }

  @Patch(':id/answers/:questionId')
  @ApiOperation({ summary: '문항별 임시 답안 저장' })
  @ApiOkResponse({ description: '저장한 임시 답안을 반환합니다.' })
  saveDraftAnswer(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveDraftAnswerDto,
  ) {
    return this.answerSessionsService.saveDraftAnswer(
      user.id,
      id,
      questionId,
      dto,
    );
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '풀이 세션 최종 제출' })
  @ApiCreatedResponse({ description: '제출된 풀이 세션을 반환합니다.' })
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.answerSessionsService.submit(user.id, id);
  }
}
