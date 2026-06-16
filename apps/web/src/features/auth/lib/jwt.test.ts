import { SignJWT } from 'jose';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { verifyAccessToken } from '@/features/auth/lib/jwt';

const JWT_SECRET = '테스트용 JWT 비밀 키';
const payload = {
  sub: 'user-1',
  role: 'USER',
  authType: 'EMAIL',
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

describe('verifyAccessToken', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('서명과 만료 시간이 유효한 토큰의 payload를 반환한다', async () => {
    await expect(verifyAccessToken(await signToken())).resolves.toEqual({
      ok: true,
      payload,
    });
  });

  it('만료된 토큰은 expired 결과를 반환한다', async () => {
    const token = await signToken({}, Math.floor(Date.now() / 1000) - 60);

    await expect(verifyAccessToken(token)).resolves.toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('payload 구조가 맞지 않으면 invalid-payload 결과를 반환한다', async () => {
    const token = await signToken({ tokenVersion: '0' });

    await expect(verifyAccessToken(token)).resolves.toEqual({
      ok: false,
      reason: 'invalid-payload',
    });
  });

  it('서명이 맞지 않는 토큰은 invalid-token 결과를 반환한다', async () => {
    const token = await signToken();
    process.env.JWT_SECRET = '다른 JWT 비밀 키';

    await expect(verifyAccessToken(token)).resolves.toEqual({
      ok: false,
      reason: 'invalid-token',
    });
  });

  it('JWT_SECRET이 없으면 에러를 던진다', async () => {
    delete process.env.JWT_SECRET;

    await expect(verifyAccessToken(await signToken())).rejects.toThrow(
      'JWT_SECRET이 설정되어 있지 않습니다.',
    );
  });
});
