import type { QuestionNoteResponseEnvelope } from '@kichulbot/api-contract/question-notes';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
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
import { SaveQuestionNoteDto } from './dto/save-question-note.dto';
import { QuestionNotesService } from './question-notes.service';

@ApiTags('question-notes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/question-notes')
export class QuestionNotesController {
  constructor(private readonly questionNotesService: QuestionNotesService) {}

  @Get(':questionId')
  @ApiOperation({ summary: '문항 메모 조회' })
  @ApiOkResponse({ description: '내 문항 메모를 조회합니다.' })
  getQuestionNote(
    @CurrentUser() user: RequestUser,
    @Param('questionId') questionId: string,
  ): Promise<QuestionNoteResponseEnvelope> {
    return this.questionNotesService.get(user.id, questionId);
  }

  @Put(':questionId')
  @ApiOperation({ summary: '문항 메모 저장' })
  @ApiOkResponse({ description: '내 문항 메모를 저장합니다.' })
  saveQuestionNote(
    @CurrentUser() user: RequestUser,
    @Param('questionId') questionId: string,
    @Body() dto: SaveQuestionNoteDto,
  ): Promise<QuestionNoteResponseEnvelope> {
    return this.questionNotesService.save(user.id, questionId, dto.content);
  }
}
