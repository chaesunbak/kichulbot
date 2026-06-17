import { ApiError } from '@kichulbot/api-contract';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DELETE } from './route';

const api = vi.hoisted(() => ({
  serverApi: {
    delete: vi.fn(),
  },
  getAuthContext: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('@/features/auth/lib/server-auth', () => ({
  getAuthContext: api.getAuthContext,
}));

vi.mock('@/shared/api/server', () => ({
  serverApi: api.serverApi,
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.getAuthContext.mockResolvedValue({
    token: 'expired-token',
    user: {
      id: 'user_1',
      email: 'user@example.com',
      nickname: '사용자',
      authType: 'EMAIL',
      linkedProviders: [],
      role: 'USER',
    },
  });
});

describe('/api/auth/account', () => {
  it('API 서버가 401을 반환하면 인증 쿠키를 삭제한다', async () => {
    api.serverApi.delete.mockRejectedValue(
      new ApiError(401, '인증 정보가 유효하지 않습니다.'),
    );

    const request = new Request('https://kichulbot.test/api/auth/account', {
      method: 'DELETE',
      headers: {
        origin: 'https://kichulbot.test',
      },
    });

    const response = await DELETE(request);

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('kichulbot_token=;');
  });
});
