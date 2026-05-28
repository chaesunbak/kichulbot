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
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: '과목 목록 조회' })
  @ApiOkResponse({ description: '과목 목록을 반환합니다.' })
  listSubjects(@CurrentUser() user: RequestUser) {
    return this.subjectsService.listSubjects(user.role);
  }
}
