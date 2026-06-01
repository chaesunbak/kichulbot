import type { AuthUser } from '@/features/auth/store';
import { ApiError, clientApi } from '@/shared/api/client';

export { ApiError };

interface AuthResult {
  user: AuthUser;
}

export async function loginApi(
  email: string,
  password: string,
): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/login', { email, password });
}

export async function registerApi(
  email: string,
  password: string,
  nickname: string,
): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/register', {
    email,
    password,
    nickname,
  });
}

export async function anonymousLoginApi(): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/anonymous');
}

export async function logoutApi(): Promise<void> {
  await clientApi.post('/api/auth/logout');
}

export async function deleteAccountApi(): Promise<void> {
  await clientApi.delete('/api/auth/account');
}
