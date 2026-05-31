import {
  Body,
  Controller,
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
    @Query('subjectId') subjectId?: string,
  ) {
    return this.tagsService.listTags(user.role, subjectId);
  }
}

@ApiTags('admin-tags')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('tags')
  @ApiOperation({ summary: '관리자 공식 태그 목록 조회' })
  @ApiOkResponse({ description: '비활성 태그를 포함해 반환합니다.' })
  listTags() {
    return this.tagsService.listAdminTags();
  }

  @Post('tags')
  @ApiOperation({ summary: '공식 태그 생성' })
  @ApiCreatedResponse({ description: '공식 태그를 생성합니다.' })
  createTag(@Body() dto: CreateOfficialTagDto) {
    return this.tagsService.createOfficialTag(dto);
  }

  @Patch('tags/:id')
  @ApiOperation({ summary: '공식 태그 수정 및 활성 상태 변경' })
  @ApiOkResponse({ description: '공식 태그를 수정합니다.' })
  updateTag(@Param('id') id: string, @Body() dto: UpdateOfficialTagDto) {
    return this.tagsService.updateOfficialTag(id, dto);
  }
}
