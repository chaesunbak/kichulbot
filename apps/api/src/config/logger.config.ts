import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { Params } from 'nestjs-pino';

function getRequestId(
  request: IncomingMessage,
  response: ServerResponse<IncomingMessage>,
) {
  const header = request.headers['x-request-id'];
  const requestId = Array.isArray(header) ? header[0] : header;
  const id = requestId?.trim() || randomUUID();

  response.setHeader('X-Request-Id', id);

  return id;
}

function getHeader(request: IncomingMessage, key: string) {
  const header = request.headers[key];

  return Array.isArray(header) ? header[0] : header;
}

function serializeRequest(request: IncomingMessage & { id?: string }) {
  return {
    id: request.id,
    method: request.method,
    url: request.url,
    cfRay: getHeader(request, 'cf-ray'),
  };
}

function serializeResponse(response: ServerResponse<IncomingMessage>) {
  return {
    statusCode: response.statusCode,
  };
}

export const loggerConfig = {
  pinoHttp: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
            },
          },
    autoLogging: {
      ignore: (request) =>
        request.url === '/api/health' || request.url === '/health',
    },
    genReqId: getRequestId,
    serializers: {
      req: serializeRequest,
      res: serializeResponse,
    },
    customLogLevel: (_request, response, error) => {
      if (error || response.statusCode >= 500) return 'error';
      if (response.statusCode >= 400) return 'warn';
      return 'info';
    },
    redact: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.accessToken',
      'req.body.refreshToken',
    ],
  },
} satisfies Params;
