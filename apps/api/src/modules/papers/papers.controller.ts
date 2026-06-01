import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestUser } from '../auth/types';
import { CreatePaperDto } from './dto/create-paper.dto';
import { UpdatePaperDto } from './dto/update-paper.dto';
import { PapersService } from './papers.service';

@ApiTags('exam-papers')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('exam-papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Get()
  @ApiOperation({
    summary: '문제지 목록 조회',
    description:
      '일반 사용자는 공개된 문제지만, 관리자는 모든 문제지를 조회합니다.',
  })
  @ApiOkResponse({ description: '문제지 목록을 반환합니다.' })
  listPapers(@CurrentUser() user: RequestUser) {
    return this.papersService.listPapers(user.role, user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '문제지 생성' })
  @ApiCreatedResponse({ description: '문제지를 생성합니다.' })
  @ApiForbiddenResponse({
    description: '관리자만 문제지를 생성할 수 있습니다.',
  })
  createPaper(@CurrentUser() user: RequestUser, @Body() dto: CreatePaperDto) {
    return this.papersService.createPaper(dto, user.role);
  }

  @Get(':id')
  @ApiOperation({
    summary: '문제지 상세 조회',
    description:
      '일반 사용자는 공개된 문제지만, 관리자는 비공개 문제지도 조회합니다.',
  })
  @ApiOkResponse({ description: '문제지 상세를 반환합니다.' })
  getPaper(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.papersService.getPaper(id, user.role, user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '문제지 공개 상태 변경' })
  @ApiOkResponse({ description: '문제지 공개 상태를 변경합니다.' })
  updatePaper(@Param('id') id: string, @Body() dto: UpdatePaperDto) {
    return this.papersService.updatePaper(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '문제지 삭제' })
  @ApiOkResponse({ description: '문제지를 삭제합니다.' })
  deletePaper(@Param('id') id: string) {
    return this.papersService.deletePaper(id);
  }
}
