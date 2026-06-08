import { describe, expect, it } from 'vitest';

import type { AuthUser } from '@/features/auth/types';
import {
  authErrorResponse,
  authSuccessResponse,
  rejectCrossOriginRequest,
} from '@/shared/lib/route-helpers';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  nickname: '홍길동',
  authType: 'EMAIL',
  linkedProviders: [],
  role: 'USER',
} satisfies AuthUser;

describe('authSuccessResponse', () => {
  it('사용자 정보와 인증 쿠키를 함께 반환한다', async () => {
    const response = authSuccessResponse(user, 'access-token');

    await expect(response.json()).resolves.toEqual({ user });
    expect(response.headers.get('set-cookie')).toContain(
      'kichulbot_token=access-token',
    );
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
  });
});

describe('authErrorResponse', () => {
  it('지정한 상태 코드와 에러 메시지를 반환한다', async () => {
    const response = authErrorResponse(400, '잘못된 요청입니다.');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: '잘못된 요청입니다.',
    });
  });
});

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
    await expect(response?.json()).resolves.toEqual({
      error: 'Cross-origin request is not allowed',
    });
  });
});
