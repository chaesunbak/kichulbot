import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

describe('rejectCrossOriginRequest', () => {
  it('요청 URL과 origin이 같으면 요청을 허용한다', () => {
    const request = new Request('https://kichulbot.test/api/auth/login', {
      headers: { origin: 'https://kichulbot.test' },
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it('프록시가 전달한 실제 호스트와 origin이 같으면 요청을 허용한다', () => {
    const request = new Request('http://internal.test/api/auth/login', {
      headers: {
        origin: 'https://gichulbot.com',
        'x-forwarded-host': 'gichulbot.com',
        'x-forwarded-proto': 'https',
      },
    });

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it('origin이 없으면 요청을 허용한다', () => {
    const request = new Request('https://kichulbot.test/api/auth/login');

    expect(rejectCrossOriginRequest(request)).toBeNull();
  });

  it('origin이 다르면 403 응답을 반환한다', async () => {
    const request = new Request('https://kichulbot.test/api/auth/login', {
      headers: { origin: 'https://evil.test' },
    });

    const response = rejectCrossOriginRequest(request);

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({
      success: false,
      error: {
        statusCode: 403,
        message: 'Cross-origin request is not allowed',
      },
    });
  });
});
