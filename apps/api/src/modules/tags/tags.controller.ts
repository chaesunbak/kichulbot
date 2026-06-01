import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { CreateOfficialTagDto } from './dto/create-official-tag.dto';
import { UpdateOfficialTagDto } from './dto/update-official-tag.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: '태그 목록 조회' })
  @ApiOkResponse({ description: '태그 목록을 반환합니다.' })
  listTags(
    @CurrentUser() user: RequestUser,
    @Query('examId') examId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (includeInactive === 'true') {
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          '관리자만 비활성 태그를 조회할 수 있습니다.',
        );
      }
      return this.tagsService.listAdminTags();
    }
    return this.tagsService.listTags(user.role, examId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '공식 태그 생성' })
  @ApiCreatedResponse({ description: '공식 태그를 생성합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  createTag(@Body() dto: CreateOfficialTagDto) {
    return this.tagsService.createOfficialTag(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '공식 태그 수정 및 활성 상태 변경' })
  @ApiOkResponse({ description: '공식 태그를 수정합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  updateTag(@Param('id') id: string, @Body() dto: UpdateOfficialTagDto) {
    return this.tagsService.updateOfficialTag(id, dto);
  }
}
