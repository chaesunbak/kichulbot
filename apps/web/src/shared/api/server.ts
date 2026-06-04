const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      cache: token ? 'no-store' : init.cache,
      headers,
    });
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
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};
