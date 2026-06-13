import { ApiError } from '@kichulbot/api-contract';

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const EMPTY_RESPONSE_STATUSES = new Set([204, 205, 304]);

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown | FormData;
}

export async function apiRequest<T>(
  path: string,
  parseData: (data: unknown) => T,
  options: ApiRequestOptions = {},
) {
  const isFormData = options.body instanceof FormData;
  const body: BodyInit | undefined =
    options.body instanceof FormData
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body,
    cache: 'no-store',
  });

  let envelope: ApiEnvelope<T>;
  try {
    envelope = await parseApiEnvelope<T>(response);
  } catch (error) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('admin:unauthorized'));
    }
    throw error;
  }

  if (!response.ok || !envelope.success) {
    let message = '요청 처리 중 오류가 발생했습니다.';

    if (!envelope.success) {
      message = Array.isArray(envelope.error.message)
        ? envelope.error.message.join('\n')
        : envelope.error.message;
    }

    if (response.status === 401) {
      window.dispatchEvent(new Event('admin:unauthorized'));
    }
    throw new ApiError(
      response.status,
      message,
      !envelope.success ? envelope.error.code : undefined,
    );
  }

  return parseData(envelope.data);
}

async function parseApiEnvelope<T>(
  response: Response,
): Promise<ApiEnvelope<T>> {
  if (EMPTY_RESPONSE_STATUSES.has(response.status)) {
    throw new ApiError(
      response.status,
      'API 서버에서 응답 본문을 받지 못했습니다. 다시 시도해 주세요.',
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const responseText = await response.text();

  if (!responseText) {
    throw new ApiError(
      response.status,
      'API 서버에서 응답 본문을 받지 못했습니다. 다시 시도해 주세요.',
    );
  }

  if (!contentType.includes('application/json')) {
    throw new ApiError(
      response.status,
      'API 서버에서 JSON이 아닌 응답을 받았습니다.',
    );
  }

  try {
    return JSON.parse(responseText) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      response.status,
      'API 서버 응답을 해석하지 못했습니다. 다시 시도해 주세요.',
    );
  }
}
