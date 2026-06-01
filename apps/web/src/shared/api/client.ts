export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError(0, '네트워크 연결을 확인해주세요');
  }

  const body = await readJson(res);
  if (!res.ok) {
    const message =
      getErrorMessage(body) ?? res.statusText ?? '오류가 발생했습니다';
    throw new ApiError(res.status, message);
  }

  return body as T;
}

async function readJson(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;

  try {
    return await res.json();
  } catch {
    throw new ApiError(
      res.status,
      res.statusText || '서버 응답을 읽을 수 없습니다',
    );
  }
}

function getErrorMessage(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const errorBody = body as Record<string, unknown>;
  return errorBody.message?.toString() ?? errorBody.error?.toString() ?? null;
}

export const clientApi = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
