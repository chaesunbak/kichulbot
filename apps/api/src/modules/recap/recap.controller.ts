import type { GetRecapSummaryResponse } from '@kichulbot/api-contract/recap';
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
import { RecapService } from './recap.service';

@ApiTags('recap')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: '인증 정보가 없거나 유효하지 않습니다.',
})
@UseGuards(JwtAuthGuard)
@Controller('me/recap')
export class RecapController {
  constructor(private readonly recapService: RecapService) {}

  @Get('summary')
  @ApiOperation({ summary: '복습 화면 요약 조회' })
  @ApiOkResponse({
    description: '오늘 풀이 통계와 오답 복습 요약을 반환합니다.',
  })
  getSummary(
    @CurrentUser() user: RequestUser,
  ): Promise<GetRecapSummaryResponse> {
    return this.recapService.getSummary(user.id);
  }
}
