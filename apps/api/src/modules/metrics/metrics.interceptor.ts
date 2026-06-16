import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { MetricsService } from './metrics.service';

const EXCLUDED_PATH_PREFIXES = ['/api/docs'];
const EXCLUDED_PATHS = new Set([
  '/health',
  '/api/health',
  '/metrics',
  '/api/metrics',
]);

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const path = getRequestPath(request);

    if (shouldSkipPath(path)) {
      return next.handle();
    }

    const start = process.hrtime.bigint();
    const route = getRouteLabel(request);

    return next.handle().pipe(
      tap(() => {
        this.recordRequest(start, request, route, response.statusCode);
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : response.statusCode >= 400
              ? response.statusCode
              : 500;

        this.recordRequest(start, request, route, statusCode);

        return throwError(() => error);
      }),
    );
  }

  private recordRequest(
    start: bigint,
    request: Request,
    route: string,
    statusCode: number,
  ) {
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;
    const method = request.method ?? 'UNKNOWN';
    const safeStatusCode = Number.isInteger(statusCode) ? statusCode : 500;

    this.metricsService.recordHttpRequest(durationSeconds, {
      method,
      route,
      status_code: String(safeStatusCode),
      status_class: `${Math.floor(safeStatusCode / 100)}xx`,
    });
  }
}

function getRequestPath(request: Request) {
  const url = request.originalUrl ?? request.url ?? '';
  const [path] = url.split('?');

  return path || '/';
}

function shouldSkipPath(path: string) {
  return (
    EXCLUDED_PATHS.has(path) ||
    EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function getRouteLabel(request: Request) {
  const routePath = (request as { route?: { path?: unknown } }).route?.path;

  if (typeof routePath === 'string') {
    return normalizeRoutePath(routePath);
  }

  if (Array.isArray(routePath) && typeof routePath[0] === 'string') {
    return normalizeRoutePath(routePath[0]);
  }

  return 'unknown';
}

function normalizeRoutePath(routePath: string) {
  return routePath.startsWith('/') ? routePath : `/${routePath}`;
}
