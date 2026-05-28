import {
  ArgumentsHost,
  Catch,
  ExceptionFilter as NestExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../dto/response.dto';

type HttpExceptionResponse = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

@Catch()
export class ExceptionFilter implements NestExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const errorBody = this.toErrorBody(exceptionResponse, statusCode);

    const body: ErrorResponse = {
      success: false,
      error: {
        statusCode,
        message: errorBody.message,
        ...(errorBody.error ? { error: errorBody.error } : {}),
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(statusCode).json(body);
  }

  private toErrorBody(
    exceptionResponse: string | object | undefined,
    statusCode: number,
  ): Pick<ErrorResponse['error'], 'message' | 'error'> {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (this.isHttpExceptionResponse(exceptionResponse)) {
      return {
        message: exceptionResponse.message ?? '요청 처리에 실패했습니다.',
        error: exceptionResponse.error,
      };
    }

    return {
      message:
        statusCode === Number(HttpStatus.INTERNAL_SERVER_ERROR)
          ? '서버 오류가 발생했습니다.'
          : '요청 처리에 실패했습니다.',
    };
  }

  private isHttpExceptionResponse(
    value: string | object | undefined,
  ): value is HttpExceptionResponse {
    return typeof value === 'object' && value !== null;
  }
}
