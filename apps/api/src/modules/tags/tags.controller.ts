import {
  Body,
  Controller,
  Delete,
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
import { RequestUser } from '../auth/types';
import { CreateOfficialTagDto } from './dto/create-official-tag.dto';
import { CreateTagGroupDto } from './dto/create-tag-group.dto';
import { UpdateOfficialTagDto } from './dto/update-official-tag.dto';
import { UpdateTagGroupDto } from './dto/update-tag-group.dto';
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
  listTags(@CurrentUser() user: RequestUser, @Query('examId') examId?: string) {
    if (user.role === UserRole.ADMIN && !examId) {
      return this.tagsService.listAdminTags();
    }
    return this.tagsService.listTags(user.role, examId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '태그 생성' })
  @ApiCreatedResponse({ description: '태그를 생성합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  createTag(@Body() dto: CreateOfficialTagDto) {
    return this.tagsService.createOfficialTag(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '태그 수정' })
  @ApiOkResponse({ description: '태그를 수정합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  updateTag(@Param('id') id: string, @Body() dto: UpdateOfficialTagDto) {
    return this.tagsService.updateOfficialTag(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '태그 삭제' })
  @ApiOkResponse({
    description: '문항에 연결되지 않은 태그를 삭제합니다.',
  })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  deleteTag(@Param('id') id: string) {
    return this.tagsService.deleteOfficialTag(id);
  }
}

@ApiTags('tag-groups')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('tag-groups')
export class TagGroupsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: '태그 그룹 목록 조회' })
  @ApiOkResponse({ description: '태그 그룹 목록을 반환합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  listTagGroups(@Query('examId') examId?: string) {
    return this.tagsService.listTagGroups(examId);
  }

  @Post()
  @ApiOperation({ summary: '태그 그룹 생성' })
  @ApiCreatedResponse({ description: '태그 그룹을 생성합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  createTagGroup(@Body() dto: CreateTagGroupDto) {
    return this.tagsService.createTagGroup(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '태그 그룹 수정' })
  @ApiOkResponse({ description: '태그 그룹을 수정합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  updateTagGroup(@Param('id') id: string, @Body() dto: UpdateTagGroupDto) {
    return this.tagsService.updateTagGroup(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '태그 그룹 삭제' })
  @ApiOkResponse({
    description: '태그가 연결되지 않은 그룹을 삭제합니다.',
  })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  deleteTagGroup(@Param('id') id: string) {
    return this.tagsService.deleteTagGroup(id);
  }
}
