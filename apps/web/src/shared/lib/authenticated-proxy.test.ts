import { ApiError } from '@kichulbot/api-contract';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ServerApiModule from '@/shared/api/server';
import { serverApi } from '@/shared/api/server';
import { proxyAuthenticatedRequest } from '@/shared/lib/authenticated-proxy';

const auth = vi.hoisted(() => ({
  getToken: vi.fn(),
}));

vi.mock('@/features/auth/server', () => ({
  getToken: auth.getToken,
}));

vi.mock('@/shared/api/server', async (importOriginal) => {
  const actual = await importOriginal<typeof ServerApiModule>();
  return {
    ...actual,
    serverApi: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockedServerApi = vi.mocked(serverApi);

beforeEach(() => {
  vi.clearAllMocks();
  auth.getToken.mockResolvedValue('access-token');
});

describe('proxyAuthenticatedRequest', () => {
  it('토큰이 없으면 401 응답을 반환한다', async () => {
    auth.getToken.mockResolvedValue(null);

    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/papers'),
      '/papers',
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: '로그인이 필요합니다.',
    });
    expect(mockedServerApi.get).not.toHaveBeenCalled();
  });

  it('GET 요청은 origin 검사 없이 백엔드로 전달한다', async () => {
    mockedServerApi.get.mockResolvedValue({ data: { papers: [] } });

    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/papers', {
        headers: { origin: 'https://evil.test' },
      }),
      '/papers',
    );

    expect(mockedServerApi.get).toHaveBeenCalledWith('/papers', 'access-token');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ papers: [] });
  });

  it('본문이 있는 요청은 JSON을 파싱해서 백엔드로 전달한다', async () => {
    mockedServerApi.patch.mockResolvedValue({ data: { ok: true } });

    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/profile', {
        method: 'PATCH',
        headers: { origin: 'https://kichulbot.test' },
        body: JSON.stringify({ nickname: '홍길동' }),
      }),
      '/profile',
    );

    expect(mockedServerApi.patch).toHaveBeenCalledWith(
      '/profile',
      { nickname: '홍길동' },
      'access-token',
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('안전하지 않은 메서드는 다른 origin 요청을 차단한다', async () => {
    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/profile', {
        method: 'POST',
        headers: { origin: 'https://evil.test' },
        body: JSON.stringify({ nickname: '홍길동' }),
      }),
      '/profile',
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Cross-origin request is not allowed',
    });
    expect(mockedServerApi.post).not.toHaveBeenCalled();
  });

  it('지원하지 않는 메서드는 405 응답을 반환한다', async () => {
    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/profile', {
        method: 'OPTIONS',
      }),
      '/profile',
    );

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      message: '허용되지 않은 요청 방식입니다.',
    });
  });

  it('JSON 본문이 잘못되면 400 응답을 반환한다', async () => {
    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/profile', {
        method: 'POST',
        headers: { origin: 'https://kichulbot.test' },
        body: '{',
      }),
      '/profile',
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: '요청 본문이 올바른 JSON이 아닙니다.',
    });
    expect(mockedServerApi.post).not.toHaveBeenCalled();
  });

  it('백엔드 ApiError를 프록시 에러 응답으로 변환한다', async () => {
    mockedServerApi.delete.mockRejectedValue(
      new ApiError(409, '삭제할 수 없습니다.'),
    );

    const response = await proxyAuthenticatedRequest(
      new Request('https://kichulbot.test/api/library/papers/paper-1', {
        method: 'DELETE',
        headers: { origin: 'https://kichulbot.test' },
      }),
      '/library/papers/paper-1',
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: '삭제할 수 없습니다.',
    });
  });
});
