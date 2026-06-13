import type { AuthUser } from '@/features/auth/types';
import { ApiError, clientApi } from '@/shared/api/client';

export { ApiError };

interface AuthResult {
  user: AuthUser;
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
  return assertOkResponse(
    await clientApi.post('/api/auth/password-reset-requests', { email }),
  );
}

export async function confirmPasswordResetApi(body: {
  token: string;
  password: string;
}): Promise<{ ok: true }> {
  return assertOkResponse(
    await clientApi.post('/api/auth/password-resets/confirm', body),
  );
}

export async function requestEmailVerificationApi(email: string): Promise<{
  ok: true;
}> {
  return assertOkResponse(
    await clientApi.post('/api/auth/email-verifications', { email }),
  );
}

export async function confirmEmailVerificationApi(body: {
  email: string;
  code: string;
}): Promise<{ emailVerificationToken: string }> {
  const response = await clientApi.post(
    '/api/auth/email-verifications/confirm',
    body,
  );
  if (
    !isRecord(response) ||
    typeof response.emailVerificationToken !== 'string'
  ) {
    throw new ApiError(500, '이메일 인증 응답이 올바르지 않습니다.');
  }
  return { emailVerificationToken: response.emailVerificationToken };
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
  code: string,
): Promise<AuthResult> {
  return clientApi.post<AuthResult>('/api/auth/oauth/session', { code });
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
