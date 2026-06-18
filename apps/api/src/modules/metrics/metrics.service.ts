import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';

import type { HttpMetricLabels } from './metrics.types';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  private readonly httpRequestDurationSeconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP 요청 처리 시간입니다.',
    labelNames: ['method', 'route', 'status_code', 'status_class'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'HTTP 요청 수입니다.',
    labelNames: ['method', 'route', 'status_code', 'status_class'],
    registers: [this.registry],
  });

  constructor() {
    this.registry.setDefaultLabels({ service: 'kichulbot-api' });
    collectDefaultMetrics({ register: this.registry });
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(durationSeconds: number, labels: HttpMetricLabels) {
    this.httpRequestDurationSeconds.observe(labels, durationSeconds);
    this.httpRequestsTotal.inc(labels);
  }
}
