import type { AuthResponse, UserResponse } from '@kichulbot/api-contract/auth';
import type { AdminPaperResponse } from '@kichulbot/api-contract/papers';
import type { TaxonomyResponse } from '@kichulbot/api-contract/taxonomy';

export type User = UserResponse;
export type AuthPayload = AuthResponse;
export type Taxonomy = TaxonomyResponse;
export type Paper = AdminPaperResponse;

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

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
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;

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
      message,
      response.status,
      !envelope.success ? envelope.error.code : undefined,
    );
  }

  return parseData(envelope.data);
}
