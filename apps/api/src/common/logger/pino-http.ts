import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function getRequestId(
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

export function serializeRequest(request: IncomingMessage & { id?: string }) {
  return {
    id: request.id,
    method: request.method,
    url: request.url,
    cfRay: getHeader(request, 'cf-ray'),
  };
}

export function serializeResponse(response: ServerResponse<IncomingMessage>) {
  return {
    statusCode: response.statusCode,
  };
}
