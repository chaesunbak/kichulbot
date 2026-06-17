import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthContext } from './server-auth';

const getAuthContextMock = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));

vi.mock('./server-auth', () => ({
  getAuthContext: getAuthContextMock,
}));

const authContext = {
  token: 'access-token',
  user: {
    id: 'user-1',
    email: 'user@example.com',
    nickname: '사용자',
    authType: 'EMAIL',
    linkedProviders: [],
    role: 'USER',
  },
} satisfies AuthContext;

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('인증 컨텍스트가 없으면 401 응답을 반환한다', async () => {
    getAuthContextMock.mockResolvedValue(null);

    const { withAuth } = await import('./with-auth');
    const handler = vi.fn();
    const response = await withAuth(handler)(
      new Request('https://kichulbot.test/api/me'),
    );

    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        statusCode: 401,
        message: '로그인이 필요합니다.',
        path: '/api/me',
      },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('kichulbot_token=;');
    expect(handler).not.toHaveBeenCalled();
  });

  it('인증 컨텍스트를 route handler에 전달한다', async () => {
    getAuthContextMock.mockResolvedValue(authContext);

    const { withAuth } = await import('./with-auth');
    const handler = vi.fn(() => Response.json({ ok: true }));
    const request = new Request('https://kichulbot.test/api/me');
    const context = { params: Promise.resolve({ id: 'user-1' }) };

    const response = await withAuth<typeof context>(handler)(request, context);

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(handler).toHaveBeenCalledWith(request, {
      ...context,
      auth: authContext,
    });
  });
});
