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
import { UserRole } from '../../infrastructure/database/prisma-client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestUser } from '../auth/types';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '분류 목록 조회' })
  @ApiOkResponse({ description: '분류 목록을 반환합니다.' })
  listCategories(@CurrentUser() user: RequestUser) {
    return this.categoriesService.listCategories(user.role);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '분류 생성' })
  @ApiCreatedResponse({ description: '분류를 생성합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '분류 수정' })
  @ApiOkResponse({ description: '분류를 수정합니다.' })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '분류 삭제' })
  @ApiOkResponse({
    description: '분류를 삭제하고 연결된 시험 분류 관계를 정리합니다.',
  })
  @ApiForbiddenResponse({ description: '관리자만 접근할 수 있습니다.' })
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
