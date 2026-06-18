import { ApiError } from '@kichulbot/api-contract';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser } from '@/features/auth/types';

const cookiesMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const verifyAccessTokenMock = vi.hoisted(() => vi.fn());
const serverApiGetMock = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/features/auth/lib/jwt', () => ({
  verifyAccessToken: verifyAccessTokenMock,
}));

vi.mock('@/shared/api/server', () => ({
  serverApi: {
    get: serverApiGetMock,
  },
}));

const user = {
  id: 'user-1',
  email: 'user@example.com',
  nickname: '사용자',
  signupMethod: 'EMAIL',
  authMethods: ['EMAIL'],
  linkedProviders: [],
  role: 'USER',
} satisfies AuthUser;

function mockCookieToken(token: string | null) {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (token ? { value: token } : undefined)),
  });
}

async function importAuthModule() {
  vi.resetModules();
  return import('./server-auth');
}

describe('server-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it('서버 전용 모듈로 선언되어 있다', async () => {
    const { readFile } = await import('node:fs/promises');

    const source = await readFile(
      new URL('./server-auth.ts', import.meta.url),
      'utf8',
    );

    expect(source.startsWith("import 'server-only';")).toBe(true);
  });

  it('쿠키가 없으면 null 세션을 반환한다', async () => {
    mockCookieToken(null);

    const { auth } = await importAuthModule();

    await expect(auth()).resolves.toBeNull();
    expect(verifyAccessTokenMock).not.toHaveBeenCalled();
    expect(serverApiGetMock).not.toHaveBeenCalled();
  });

  it('로컬 JWT 검증에 실패하면 null 세션을 반환한다', async () => {
    mockCookieToken('access-token');
    verifyAccessTokenMock.mockResolvedValue({
      ok: false,
      reason: 'invalid-token',
    });

    const { auth } = await importAuthModule();

    await expect(auth()).resolves.toBeNull();
    expect(serverApiGetMock).not.toHaveBeenCalled();
  });

  it('/me 응답으로 현재 사용자 세션을 반환한다', async () => {
    mockCookieToken('access-token');
    verifyAccessTokenMock.mockResolvedValue({ ok: true, payload: {} });
    serverApiGetMock.mockResolvedValue({ data: { user } });

    const { auth, getAuthContext } = await importAuthModule();

    await expect(auth()).resolves.toEqual({ user });
    await expect(getAuthContext()).resolves.toEqual({
      user,
      token: 'access-token',
    });
    expect(serverApiGetMock).toHaveBeenCalledWith('/me', 'access-token');
  });

  it('/me가 401을 반환하면 null 세션을 반환한다', async () => {
    mockCookieToken('access-token');
    verifyAccessTokenMock.mockResolvedValue({ ok: true, payload: {} });
    serverApiGetMock.mockRejectedValue(
      new ApiError(401, '로그인이 필요합니다.'),
    );

    const { auth } = await importAuthModule();

    await expect(auth()).resolves.toBeNull();
  });

  it('requireAuth는 인증되지 않은 요청을 로그인 페이지로 보낸다', async () => {
    mockCookieToken(null);

    const { requireAuth } = await importAuthModule();

    await expect(requireAuth('/my/settings')).rejects.toThrow(
      'redirect:/login?next=%2Fmy%2Fsettings',
    );
    expect(redirectMock).toHaveBeenCalledWith('/login?next=%2Fmy%2Fsettings');
  });
});
