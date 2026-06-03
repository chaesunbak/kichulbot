import type { AuthUser } from '@/features/auth/store';
import { ApiError, clientApi } from '@/shared/api/client';

export { ApiError };

interface AuthResult {
  user: AuthUser;
}

export async function anonymousLoginApi(): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/anonymous');
}

export async function loginWithEmailApi(body: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/login', body);
}

export async function requestPasswordResetApi(email: string): Promise<{
  ok: true;
}> {
  return clientApi.post('/api/auth/password-reset-requests', { email });
}

export async function confirmPasswordResetApi(body: {
  token: string;
  password: string;
}): Promise<{ ok: true }> {
  return clientApi.post('/api/auth/password-resets/confirm', body);
}

export async function requestEmailVerificationApi(email: string): Promise<{
  ok: true;
}> {
  return clientApi.post('/api/auth/email-verifications', { email });
}

export async function confirmEmailVerificationApi(body: {
  email: string;
  code: string;
}): Promise<{ emailVerificationToken: string }> {
  return clientApi.post('/api/auth/email-verifications/confirm', body);
}

export async function registerWithEmailApi(body: {
  email: string;
  password: string;
  nickname?: string;
  emailVerificationToken: string;
}): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/register', body);
}

export async function completeOAuthSessionApi(
  accessToken: string,
): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/oauth/session', { accessToken });
}

export async function convertAnonymousWithKakaoApi(body: {
  providerAccountId: string;
  providerEmail?: string | null;
  providerNickname?: string | null;
  rawProfile?: Record<string, unknown> | null;
}): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/convert/kakao', body);
}

export async function logoutApi(): Promise<void> {
  await clientApi.post('/api/auth/logout');
}

export async function deleteAccountApi(): Promise<void> {
  await clientApi.delete('/api/auth/account');
}

export async function updateProfileApi(nickname: string): Promise<AuthResult> {
  return clientApi.patch<AuthResult>('/api/me', { nickname });
}

export async function listAuthConnectionsApi(): Promise<{
  connections: Array<{
    provider: 'KAKAO';
    providerEmail: string | null;
    providerNickname: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
}> {
  return clientApi.get('/api/me/auth-connections');
}
