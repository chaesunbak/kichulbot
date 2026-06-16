import type { Response } from 'express';

import { MetricsController } from './metrics.controller';
import type { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  it('Prometheus text format을 그대로 반환한다', async () => {
    const type = jest.fn();
    const controller = new MetricsController({
      getContentType: () => 'text/plain; version=0.0.4; charset=utf-8',
      getMetrics: () =>
        Promise.resolve('# HELP http_requests_total HTTP 요청 수입니다.\n'),
    } as unknown as MetricsService);

    await expect(
      controller.getMetrics({ type } as unknown as Response),
    ).resolves.toBe('# HELP http_requests_total HTTP 요청 수입니다.\n');

    expect(type).toHaveBeenCalledWith(
      'text/plain; version=0.0.4; charset=utf-8',
    );
  });
});
