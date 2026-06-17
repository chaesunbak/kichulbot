import 'server-only';

import { ApiError } from '@kichulbot/api-contract';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import type { AuthSession, AuthUser } from '@/features/auth/types';
import { serverApi } from '@/shared/api/server';

import { COOKIE_NAME } from './auth-cookie';
import { verifyAccessToken } from './jwt';

export type AuthContext = AuthSession & {
  token: string;
};

export const getAuthToken = cache(async function getAuthToken(): Promise<
  string | null
> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value ?? null;
  if (!token) return null;

  const result = await verifyAccessToken(token);
  return result.ok ? token : null;
});

export const getAuthContext = cache(
  async function getAuthContext(): Promise<AuthContext | null> {
    const token = await getAuthToken();
    if (!token) return null;

    try {
      const res = await serverApi.get<{ data: { user: AuthUser } }>(
        '/me',
        token,
      );
      return { user: res.data.user, token };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      return null;
    }
  },
);

export const auth = cache(async function auth(): Promise<AuthSession | null> {
  const context = await getAuthContext();
  if (!context) return null;

  return { user: context.user };
});

export async function requireAuth(nextPath = '/') {
  const session = await auth();
  if (!session) redirectToLogin(nextPath);

  return session;
}

export async function requireAuthContext(nextPath = '/') {
  const context = await getAuthContext();
  if (!context) redirectToLogin(nextPath);

  return context;
}

function redirectToLogin(nextPath: string): never {
  redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}
