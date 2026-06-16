import 'server-only';

import { ApiError } from '@kichulbot/api-contract';

import { getInternalApiBaseUrl } from './base-url';

const BASE_URL = getInternalApiBaseUrl();

type NextFetchOptions = RequestInit & {
  next?: {
    revalidate?: false | 0 | number;
    tags?: string[];
  };
};

type ServerApiRequestOptions = NextFetchOptions & { token?: string };
type ServerApiOptions = Omit<
  ServerApiRequestOptions,
  'body' | 'method' | 'token'
>;

async function request<T>(
  path: string,
  options: ServerApiRequestOptions = {},
): Promise<T> {
  const { token, ...init } = options;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestInit: NextFetchOptions = {
    ...init,
    headers,
  };
  if (token && !hasExplicitCachePolicy(init)) {
    requestInit.cache = 'no-store';
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, requestInit);
  } catch {
    throw new ApiError(0, '네트워크 연결을 확인해주세요');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      getErrorMessage(body) ?? res.statusText ?? '오류가 발생했습니다',
    );
  }

  if (res.status === 204) return undefined as T;

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, '서버 응답을 읽을 수 없습니다');
  }
}

function hasExplicitCachePolicy(init: NextFetchOptions) {
  return init.cache !== undefined || init.next !== undefined;
}

function getErrorMessage(body: unknown) {
  if (!body || typeof body !== 'object') return null;

  const errorBody = body as Record<string, unknown>;
  const directMessage = normalizeMessage(errorBody.message);
  if (directMessage) return directMessage;

  const directError = normalizeMessage(errorBody.error);
  if (directError) return directError;

  if (errorBody.error && typeof errorBody.error === 'object') {
    const nestedError = errorBody.error as Record<string, unknown>;
    return (
      normalizeMessage(nestedError.message) ??
      normalizeMessage(nestedError.error)
    );
  }

  return null;
}

function normalizeMessage(message: unknown) {
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' && message.trim() ? message : null;
}

export const serverApi = {
  get: <T>(path: string, token?: string, options: ServerApiOptions = {}) =>
    request<T>(path, { ...options, method: 'GET', token }),

  post: <T>(
    path: string,
    body: unknown,
    token?: string,
    options: ServerApiOptions = {},
  ) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  patch: <T>(
    path: string,
    body: unknown,
    token?: string,
    options: ServerApiOptions = {},
  ) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  put: <T>(
    path: string,
    body: unknown,
    token?: string,
    options: ServerApiOptions = {},
  ) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  delete: <T>(path: string, token?: string, options: ServerApiOptions = {}) =>
    request<T>(path, { ...options, method: 'DELETE', token }),
};
