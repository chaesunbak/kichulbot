import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '헬스 체크' })
  @ApiOkResponse({
    description: 'API 서버 상태를 반환합니다.',
    type: HealthResponseDto,
  })
  check() {
    return {
      status: 'ok',
    };
  }
}
