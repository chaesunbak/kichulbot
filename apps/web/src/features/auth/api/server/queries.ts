import { cookies } from 'next/headers';
import { cache } from 'react';

import type { AuthUser } from '@/features/auth/types';
import { serverApi } from '@/shared/api/server';

export const COOKIE_NAME = 'kichulbot_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: COOKIE_MAX_AGE,
  sameSite: 'lax' as const,
};

export const getToken = cache(async function getToken(): Promise<
  string | null
> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
});

export const getCurrentUser = cache(async function getCurrentUser(
  token: string,
): Promise<AuthUser> {
  const res = await serverApi.get<{ data: { user: AuthUser } }>('/me', token);
  return res.data.user;
});

export const getUser = cache(
  async function getUser(): Promise<AuthUser | null> {
    const token = await getToken();
    if (!token) return null;
    try {
      return await getCurrentUser(token);
    } catch {
      return null;
    }
  },
);
