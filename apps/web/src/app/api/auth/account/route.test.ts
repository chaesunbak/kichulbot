import { ApiError } from '@kichulbot/api-contract';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE } from './route';

const api = vi.hoisted(() => ({
  serverApi: {
    delete: vi.fn(),
  },
}));

vi.mock('server-only', () => ({}));

vi.mock('@/shared/api/server', () => ({
  serverApi: api.serverApi,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/auth/account', () => {
  it('API 서버가 401을 반환하면 인증 쿠키를 삭제한다', async () => {
    api.serverApi.delete.mockRejectedValue(
      new ApiError(401, '인증 정보가 유효하지 않습니다.'),
    );

    const request = Object.assign(
      new Request('https://kichulbot.test/api/auth/account', {
        method: 'DELETE',
        headers: {
          origin: 'https://kichulbot.test',
        },
      }),
      {
        cookies: {
          get: (name: string) =>
            name === 'kichulbot_token' ? { value: 'expired-token' } : undefined,
        },
      },
    );

    const response = await DELETE(request as Parameters<typeof DELETE>[0]);

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('kichulbot_token=;');
  });
});
