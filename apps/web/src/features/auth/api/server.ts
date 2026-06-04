import type { AuthUser } from '@/features/auth/types';
import { serverApi } from '@/shared/api/server';

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const res = await serverApi.get<{ data: { user: AuthUser } }>('/me', token);
  return res.data.user;
}

export async function updateCurrentUser(
  nickname: string,
  token: string,
): Promise<AuthUser> {
  const res = await serverApi.patch<{ data: { user: AuthUser } }>(
    '/me',
    { nickname },
    token,
  );
  return res.data.user;
}
