import type { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from '@/proxy';

function createRequest(path: string, token?: string) {
  const nextUrl = new URL(path, 'https://kichulbot.test');
  const clonedNextUrl = Object.assign(nextUrl, {
    clone: () => new URL(nextUrl),
  });

  return {
    nextUrl: clonedNextUrl,
    cookies: {
      get: (name: string) =>
        name === 'kichulbot_token' && token ? { value: token } : undefined,
    },
  } as unknown as NextRequest;
}

describe('proxy', () => {
  it('보호 경로에 토큰이 없으면 로그인 페이지로 이동한다', () => {
    const response = proxy(createRequest('/library'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary',
    );
  });

  it('보호 경로의 query string을 next 파라미터에 보존한다', () => {
    const response = proxy(createRequest('/library/notes?paperId=paper-1'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary%2Fnotes%3FpaperId%3Dpaper-1',
    );
  });

  it('보호 경로에 토큰이 있으면 요청을 통과시킨다', () => {
    const response = proxy(createRequest('/library', 'access-token'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('보호 경로가 아니면 토큰 없이도 요청을 통과시킨다', () => {
    const response = proxy(createRequest('/resources'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('보호 경로와 비슷한 접두어는 보호 경로로 처리하지 않는다', () => {
    const response = proxy(createRequest('/libraryish'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('다른 보호 경로도 토큰이 없으면 로그인 페이지로 이동한다', () => {
    const response = proxy(createRequest('/my/settings'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Fmy%2Fsettings',
    );
  });
});
