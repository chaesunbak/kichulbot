import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';

import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @RawResponse()
  @ApiExcludeEndpoint()
  async getMetrics(@Res({ passthrough: true }) response: Response) {
    response.type(this.metricsService.getContentType());

    return this.metricsService.getMetrics();
  }
}
