import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { serverApi } from '@/shared/api/server';

const jsonResponse = () =>
  Promise.resolve(
    new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

describe('serverApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(jsonResponse));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('토큰 요청은 별도 캐시 정책이 없으면 no-store로 보낸다', async () => {
    await serverApi.get('/me', 'access-token');

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.cache).toBe('no-store');
    expect((init.headers as Headers).get('Authorization')).toBe(
      'Bearer access-token',
    );
  });

  it('호출자가 지정한 next 캐시 정책을 덮어쓰지 않는다', async () => {
    await serverApi.get('/public/exam-papers', 'access-token', {
      next: { revalidate: 300 },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [
      string,
      RequestInit & { next?: { revalidate?: number } },
    ];
    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 300 });
  });
});
