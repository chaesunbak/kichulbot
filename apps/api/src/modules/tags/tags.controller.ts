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
  listTags(@CurrentUser() user: RequestUser) {
    return this.tagsService.listTags(user.role);
  }
}
