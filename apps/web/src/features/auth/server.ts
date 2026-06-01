import { cache } from 'react';
import { cookies } from 'next/headers';
import { api } from '@/shared/api/api-client';
import type { AuthUser } from '@/features/auth/store';

export { type AuthUser };

export const COOKIE_NAME = 'kichulbot_token';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: COOKIE_MAX_AGE,
  sameSite: 'lax' as const,
};

export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export const getUser = cache(async (): Promise<AuthUser | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await api.get<{ data: { user: AuthUser } }>('/me', token);
    return res.data.user;
  } catch {
    (await cookies()).delete(COOKIE_NAME);
    return null;
  }
});
