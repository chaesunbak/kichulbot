import type { AuthUser } from '@/stores/auth-store';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface AuthResult {
  user: AuthUser;
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new ApiError(
      res.status,
      res.statusText || '서버 응답을 읽을 수 없습니다',
    );
  }
}

async function handleAuthResponse(res: Response): Promise<AuthResult> {
  const data = await parseJson(res);
  if (!res.ok) {
    const message =
      (data as Record<string, unknown>)?.error?.toString() ??
      '오류가 발생했습니다';
    throw new ApiError(res.status, message);
  }
  return data as AuthResult;
}

async function authFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(0, '네트워크 연결을 확인해주세요');
  }
}

export async function loginApi(
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await authFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleAuthResponse(res);
}

export async function registerApi(
  email: string,
  password: string,
  nickname: string,
): Promise<AuthResult> {
  const res = await authFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  });
  return handleAuthResponse(res);
}

export async function anonymousLoginApi(): Promise<AuthResult> {
  const res = await authFetch('/api/auth/anonymous', { method: 'POST' });
  return handleAuthResponse(res);
}
