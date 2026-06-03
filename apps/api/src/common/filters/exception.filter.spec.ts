import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { ExceptionFilter } from './exception.filter';

function createHost(url = '/questions?year=2026') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;
  const request = { url } as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;

  return { host, json, status };
}

describe('ExceptionFilter', () => {
  let filter: ExceptionFilter;

  beforeEach(() => {
    filter = new ExceptionFilter();
  });

  it('객체 형태의 HTTP 예외 응답을 표준 에러 응답으로 변환한다', () => {
    const { host, json, status } = createHost('/auth/login');
    const exception = new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['email must be an email'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['email must be an email'],
        error: 'Bad Request',
        path: '/auth/login',
        timestamp: expect.any(String),
      },
    });
  });

  it('문자열 형태의 HTTP 예외 응답을 오류 라벨 없이 변환한다', () => {
    const { host, json, status } = createHost('/health');
    const exception = new HttpException('서비스를 사용할 수 없습니다.', 503);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: '서비스를 사용할 수 없습니다.',
        path: '/health',
        timestamp: expect.any(String),
      },
    });
  });

  it('HTTP 예외가 아닌 오류는 500 응답으로 처리하고 로그를 남긴다', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const { host, json, status } = createHost('/papers');
    const exception = new Error('database unavailable');

    filter.catch(exception, host);

    expect(consoleError).toHaveBeenCalledWith(exception);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '서버 오류가 발생했습니다.',
        path: '/papers',
        timestamp: expect.any(String),
      },
    });

    consoleError.mockRestore();
  });
});
