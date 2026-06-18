import { SignJWT } from 'jose';
import type { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { proxy } from '@/proxy';

const JWT_SECRET = '테스트용 JWT 비밀 키';
const payload = {
  sub: 'user-1',
  role: 'USER',
  tokenVersion: 0,
} as const;

async function signToken(
  overrides: Record<string, unknown> = {},
  expiresAt = Math.floor(Date.now() / 1000) + 60,
) {
  return new SignJWT({ ...payload, ...overrides })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(JWT_SECRET));
}

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
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe('proxy', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('보호 경로에 토큰이 없으면 로그인 페이지로 이동한다', async () => {
    const response = await proxy(createRequest('/library'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary',
    );
  });

  it('보호 경로의 query string을 next 파라미터에 보존한다', async () => {
    const response = await proxy(
      createRequest('/library/notes?paperId=paper-1'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary%2Fnotes%3FpaperId%3Dpaper-1',
    );
  });

  it('보호 경로에 유효한 토큰이 있으면 요청을 통과시킨다', async () => {
    const response = await proxy(createRequest('/library', await signToken()));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('만료된 토큰이면 로그인 페이지로 이동한다', async () => {
    const response = await proxy(
      createRequest(
        '/library',
        await signToken({}, Math.floor(Date.now() / 1000) - 60),
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary',
    );
  });

  it('서명이 맞지 않는 토큰이면 로그인 페이지로 이동한다', async () => {
    process.env.JWT_SECRET = '다른 JWT 비밀 키';

    const response = await proxy(createRequest('/library', await signToken()));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary',
    );
  });

  it('payload 구조가 맞지 않는 토큰이면 로그인 페이지로 이동한다', async () => {
    const response = await proxy(
      createRequest('/library', await signToken({ tokenVersion: '0' })),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Flibrary',
    );
  });

  it('보호 경로가 아니면 토큰 없이도 요청을 통과시킨다', async () => {
    const response = await proxy(createRequest('/resources'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('보호 경로와 비슷한 접두어는 보호 경로로 처리하지 않는다', async () => {
    const response = await proxy(createRequest('/libraryish'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('다른 보호 경로도 토큰이 없으면 로그인 페이지로 이동한다', async () => {
    const response = await proxy(createRequest('/my/settings'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Fmy%2Fsettings',
    );
  });

  it('모의고사 경로는 토큰 없이도 요청을 통과시킨다', async () => {
    const response = await proxy(createRequest('/mock-exams'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('로컬 풀이 경로는 토큰 없이도 요청을 통과시킨다', async () => {
    const response = await proxy(createRequest('/solve/local/local_1'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('로컬 결과 경로는 토큰 없이도 요청을 통과시킨다', async () => {
    const response = await proxy(createRequest('/results/local/local_1'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.has('location')).toBe(false);
  });

  it('서버 풀이 경로는 토큰이 없으면 로그인 페이지로 이동한다', async () => {
    const response = await proxy(createRequest('/solve/session_1'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://kichulbot.test/login?next=%2Fsolve%2Fsession_1',
    );
  });
});
