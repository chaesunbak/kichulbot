import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  forwardAuthSessionRequest,
  forwardJsonBffRequest,
} from '@/shared/lib/api-bff-forwarder';

describe('forwardJsonBffRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('upstream 상태 코드와 허용된 헤더를 보존한다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 201,
        headers: {
          Location: '/api/jobs/job_1',
          'Retry-After': '30',
          'X-Secret': 'hidden',
        },
      }),
    );

    const response = await forwardJsonBffRequest(
      new Request('https://kichulbot.test/api/me/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      }),
      '/me/jobs',
      'access-token',
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('Location')).toBe('/api/jobs/job_1');
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(response.headers.has('X-Secret')).toBe(false);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { ok: true },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).get('Authorization')).toBe(
      'Bearer access-token',
    );
    expect(init.cache).toBe('no-store');
  });

  it('upstream 204 응답은 본문 없이 보존한다', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const response = await forwardJsonBffRequest(
      new Request('https://kichulbot.test/api/me/items/item_1', {
        method: 'DELETE',
      }),
      '/me/items/item_1',
      'access-token',
    );

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
  });

  it('토큰이 없으면 Authorization 없이 upstream으로 전달한다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ok: true } }), {
        status: 200,
      }),
    );

    await forwardJsonBffRequest(
      new Request('https://kichulbot.test/api/public/question-reports/q_1', {
        method: 'POST',
        body: JSON.stringify({ content: '신고합니다.' }),
      }),
      '/public/question-reports/q_1',
      null,
    );

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).has('Authorization')).toBe(false);
  });

  it('upstream 401 응답이면 인증 쿠키를 삭제한다', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            statusCode: 401,
            message: '인증 정보가 유효하지 않습니다.',
            path: '/api/me',
            timestamp: '2026-06-17T00:00:00.000Z',
          },
        }),
        { status: 401 },
      ),
    );

    const response = await forwardJsonBffRequest(
      new Request('https://kichulbot.test/api/me'),
      '/me',
      'expired-token',
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('kichulbot_token=;');
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        statusCode: 401,
        message: '인증 정보가 유효하지 않습니다.',
        path: '/api/me',
        timestamp: '2026-06-17T00:00:00.000Z',
      },
    });
  });
});

describe('forwardAuthSessionRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('인증 성공 응답은 accessToken을 쿠키로 옮기고 본문에서 제거한다', async () => {
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      nickname: '홍길동',
      signupMethod: 'EMAIL',
      authMethods: ['EMAIL'],
      linkedProviders: [],
      role: 'USER',
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { user, accessToken: 'access-token' },
        }),
        { status: 201 },
      ),
    );

    const response = await forwardAuthSessionRequest(
      new Request('https://kichulbot.test/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password',
        }),
      }),
      '/auth/login',
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain(
      'kichulbot_token=access-token',
    );
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { user },
    });
  });

  it('인증 실패 응답은 upstream error envelope를 그대로 반환한다', async () => {
    const errorBody = {
      success: false,
      error: {
        statusCode: 401,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        error: 'Unauthorized',
        path: '/api/auth/login',
        timestamp: '2026-06-17T00:00:00.000Z',
      },
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(errorBody), { status: 401 }),
    );

    const response = await forwardAuthSessionRequest(
      new Request('https://kichulbot.test/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: 'wrong' }),
      }),
      '/auth/login',
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual(errorBody);
  });
});
