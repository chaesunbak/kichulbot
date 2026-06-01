import { cookies } from 'next/headers';
import { cache } from 'react';

import { getCurrentUser } from '@/features/auth/api/server';
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
    return await getCurrentUser(token);
  } catch {
    (await cookies()).delete(COOKIE_NAME);
    return null;
  }
});
