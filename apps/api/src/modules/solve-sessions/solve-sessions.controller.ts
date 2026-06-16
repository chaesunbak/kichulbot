import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Put,
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

import { AnswerMode } from '../../infrastructure/database/prisma-client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/types';
import { ListSolveSessionLogsDto } from './dto/list-solve-session-logs.dto';
import { SaveAnswerDto } from './dto/save-answer.dto';
import { StartSolveSessionDto } from './dto/start-solve-session.dto';
import { SolveSessionsService } from './solve-sessions.service';

@ApiTags('solve-sessions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/solve-sessions')
export class SolveSessionsController {
  constructor(private readonly solveSessionsService: SolveSessionsService) {}

  @Get()
  @ApiOperation({ summary: '내 풀이 로그 조회' })
  @ApiOkResponse({
    description: '진행 중이거나 종료한 풀이 로그를 반환합니다.',
  })
  listLogs(
    @CurrentUser() user: RequestUser,
    @Query() query: ListSolveSessionLogsDto,
  ) {
    return this.solveSessionsService.listLogs(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: '문제지 풀이 세션 시작' })
  @ApiCreatedResponse({ description: '기존 세션 또는 새 세션을 반환합니다.' })
  start(@CurrentUser() user: RequestUser, @Body() dto: StartSolveSessionDto) {
    return this.solveSessionsService.start(user.id, dto.paperId, dto.mode);
  }

  @Get(':id')
  @ApiOperation({ summary: '문제지 풀이 데이터 조회' })
  @ApiOkResponse({ description: '문항과 저장된 임시 답안을 반환합니다.' })
  get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.solveSessionsService.get(user.id, id);
  }

  @Put(':id/answers/:questionId')
  @ApiOperation({ summary: '문항별 임시 답안 저장' })
  @ApiOkResponse({ description: '저장한 임시 답안을 반환합니다.' })
  saveAnswer(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.solveSessionsService.saveAnswer(user.id, id, questionId, dto);
  }

  @Post(':id/submissions')
  @ApiOperation({ summary: '풀이 세션 최종 제출' })
  @ApiCreatedResponse({ description: '제출된 풀이 세션을 반환합니다.' })
  submit(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.solveSessionsService.submit(user.id, id);
  }
}

@ApiTags('solve-sessions')
@Controller('public/solve-sessions')
export class PublicSolveSessionsController {
  constructor(private readonly solveSessionsService: SolveSessionsService) {}

  @Get('papers/:paperId')
  @ApiOperation({ summary: '공개 문제지 풀이 데이터 조회' })
  @ApiOkResponse({ description: '비로그인 풀이에 필요한 문항을 반환합니다.' })
  getPaperSession(
    @Param('paperId') paperId: string,
    @Query(
      'mode',
      new DefaultValuePipe(AnswerMode.EXAM),
      new ParseEnumPipe(AnswerMode, {
        exceptionFactory: () =>
          new BadRequestException('지원하지 않는 풀이 방식입니다.'),
      }),
    )
    mode: AnswerMode = AnswerMode.EXAM,
  ) {
    return this.solveSessionsService.getPublicPaperSession(paperId, mode);
  }
}
