import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { REDIRECT_METADATA } from '@nestjs/common/constants';
import { lastValueFrom, of } from 'rxjs';

import { ResponseInterceptor } from './response.interceptor';

function createContext(handler: () => void): ExecutionContext {
  return {
    getHandler: () => handler,
  } as unknown as ExecutionContext;
}

function createNext<T>(data: T): CallHandler<T> {
  return {
    handle: jest.fn(() => of(data)),
  };
}

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('핸들러 응답을 성공 응답 포맷으로 감싼다', async () => {
    const handler = jest.fn();
    const context = createContext(handler);
    const next = createNext({ status: 'ok' });

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('리다이렉트 메타데이터가 있는 핸들러 응답은 그대로 반환한다', async () => {
    const handler = jest.fn();
    Reflect.defineMetadata(REDIRECT_METADATA, '/', handler);
    const context = createContext(handler);
    const next = createNext(undefined);

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).resolves.toBeUndefined();
  });
});
