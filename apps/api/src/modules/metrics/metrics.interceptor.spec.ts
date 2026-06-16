import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';

import { MetricsInterceptor } from './metrics.interceptor';
import type { MetricsService } from './metrics.service';

function createContext(request: Partial<Request>, response: Partial<Response>) {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

function createNext<T>(value: T): CallHandler<T> {
  return {
    handle: jest.fn(() => of(value)),
  };
}

describe('MetricsInterceptor', () => {
  let recordHttpRequest: jest.Mock;
  let interceptor: MetricsInterceptor;

  beforeEach(() => {
    recordHttpRequest = jest.fn();
    interceptor = new MetricsInterceptor({
      recordHttpRequest,
    } as unknown as MetricsService);
  });

  it('성공 응답의 처리 시간을 route 템플릿 기준으로 기록한다', async () => {
    const context = createContext(
      {
        method: 'GET',
        originalUrl: '/api/questions/123',
        route: { path: '/questions/:id' },
      },
      { statusCode: 200 },
    );

    await expect(
      lastValueFrom(interceptor.intercept(context, createNext({ id: '123' }))),
    ).resolves.toEqual({ id: '123' });

    expect(recordHttpRequest).toHaveBeenCalledWith(expect.any(Number), {
      method: 'GET',
      route: '/questions/:id',
      status_code: '200',
      status_class: '2xx',
    });
  });

  it.each(['/api/health', '/api/metrics', '/api/docs', '/api/docs-json'])(
    '집계 제외 경로 %s 요청은 기록하지 않는다',
    async (originalUrl) => {
      const context = createContext(
        {
          method: 'GET',
          originalUrl,
          route: { path: '/metrics' },
        },
        { statusCode: 200 },
      );

      await lastValueFrom(interceptor.intercept(context, createNext('ok')));

      expect(recordHttpRequest).not.toHaveBeenCalled();
    },
  );

  it('global prefix가 없는 헬스 체크 요청도 기록하지 않는다', async () => {
    const context = createContext(
      {
        method: 'GET',
        originalUrl: '/health',
        route: { path: '/health' },
      },
      { statusCode: 200 },
    );

    await lastValueFrom(interceptor.intercept(context, createNext('ok')));

    expect(recordHttpRequest).not.toHaveBeenCalled();
  });

  it('HTTP 예외는 예외 status code로 기록하고 다시 던진다', async () => {
    const context = createContext(
      {
        method: 'POST',
        originalUrl: '/api/auth/login',
        route: { path: '/auth/login' },
      },
      { statusCode: 201 },
    );
    const error = new BadRequestException('요청이 올바르지 않습니다.');
    const next = {
      handle: jest.fn(() => throwError(() => error)),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBe(error);

    expect(recordHttpRequest).toHaveBeenCalledWith(expect.any(Number), {
      method: 'POST',
      route: '/auth/login',
      status_code: '400',
      status_class: '4xx',
    });
  });
});
