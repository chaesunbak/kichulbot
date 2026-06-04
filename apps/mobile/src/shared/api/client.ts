import { env } from '@/shared/lib/env';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code?: string;
        message: string | string[];
      };
    };

interface ResponseSchema<T> {
  parse: (data: unknown) => T;
}

interface ApiRequestOptions {
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  token?: string | null;
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  responseSchema: ResponseSchema<T>,
  options: ApiRequestOptions = {},
) {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<unknown>;

  if (!response.ok || !envelope.success) {
    throw createApiError(response.status, envelope);
  }

  return responseSchema.parse(envelope.data);
}

function createApiError(status: number, envelope: ApiEnvelope<unknown>) {
  if (envelope.success) {
    return new ApiError('요청 처리 중 오류가 발생했습니다.', status);
  }

  const message = Array.isArray(envelope.error.message)
    ? envelope.error.message.join('\n')
    : envelope.error.message;

  return new ApiError(message, status, envelope.error.code);
}
