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

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(
  handler: (() => void | Promise<void>) | null,
) {
  unauthorizedHandler = handler;
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

  const envelope = (await parseJson(response)) as ApiEnvelope<unknown>;

  if (!response.ok || isErrorEnvelope(envelope)) {
    const error = createApiError(response.status, envelope);
    if (error.status === 401) {
      await unauthorizedHandler?.();
    }
    throw error;
  }

  return responseSchema.parse(readEnvelopeData(envelope));
}

function createApiError(status: number, envelope: ApiEnvelope<unknown>) {
  if (isDataEnvelope(envelope)) {
    return new ApiError('요청 처리 중 오류가 발생했습니다.', status);
  }

  const message = Array.isArray(envelope.error.message)
    ? envelope.error.message.join('\n')
    : envelope.error.message;

  return new ApiError(message, status, envelope.error.code);
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return { success: true, data: null };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      error: { message: '서버 응답을 읽을 수 없습니다.' },
    };
  }
}

function readEnvelopeData<T>(envelope: ApiEnvelope<T>) {
  if (isDataEnvelope(envelope)) {
    return envelope.data;
  }

  throw new ApiError('서버 응답을 읽을 수 없습니다.', 500);
}

function isDataEnvelope<T>(envelope: ApiEnvelope<T>): envelope is { data: T } {
  return 'data' in envelope;
}

function isErrorEnvelope<T>(
  envelope: ApiEnvelope<T>,
): envelope is Extract<ApiEnvelope<T>, { success: false }> {
  return 'success' in envelope && envelope.success === false;
}
