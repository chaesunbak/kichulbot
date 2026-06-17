import type {
  EmailVerificationConfirmResponse,
  EmailVerificationIssueResponse,
  PasswordResetConfirmResponse,
  PasswordResetIssueResponse,
} from '@kichulbot/api-contract';

import type { AuthUser } from '@/features/auth/types';
import { clientApi } from '@/shared/api/client';

interface AuthResult {
  user: AuthUser;
}

export async function loginWithEmailApi(body: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const res = await clientApi.post<{ data: AuthResult }>(
    '/api/auth/login',
    body,
  );
  return res.data;
}

export async function requestPasswordResetApi(
  email: string,
): Promise<PasswordResetIssueResponse> {
  const res = await clientApi.post<{ data: PasswordResetIssueResponse }>(
    '/api/auth/password-reset-requests',
    { email },
  );
  return res.data;
}

export async function confirmPasswordResetApi(body: {
  token: string;
  password: string;
}): Promise<PasswordResetConfirmResponse> {
  const res = await clientApi.post<{ data: PasswordResetConfirmResponse }>(
    '/api/auth/password-resets/confirm',
    body,
  );
  return res.data;
}

export async function requestEmailVerificationApi(
  email: string,
): Promise<EmailVerificationIssueResponse> {
  const res = await clientApi.post<{ data: EmailVerificationIssueResponse }>(
    '/api/auth/email-verifications',
    { email },
  );
  return res.data;
}

export async function confirmEmailVerificationApi(body: {
  email: string;
  code: string;
}): Promise<EmailVerificationConfirmResponse> {
  const res = await clientApi.post<{ data: EmailVerificationConfirmResponse }>(
    '/api/auth/email-verifications/confirm',
    body,
  );
  return res.data;
}

export async function registerWithEmailApi(body: {
  email: string;
  password: string;
  nickname?: string;
  emailVerificationToken: string;
}): Promise<AuthResult> {
  const res = await clientApi.post<{ data: AuthResult }>(
    '/api/auth/register',
    body,
  );
  return res.data;
}

export async function completeOAuthSessionApi(
  code: string,
): Promise<AuthResult> {
  const res = await clientApi.post<{ data: AuthResult }>(
    '/api/auth/oauth/session',
    { code },
  );
  return res.data;
}

export async function logoutApi(): Promise<void> {
  await clientApi.post('/api/auth/logout');
}

export async function deleteAccountApi(): Promise<void> {
  await clientApi.delete('/api/auth/account');
}

export async function updateProfileApi(nickname: string): Promise<AuthResult> {
  const res = await clientApi.patch<{ data: AuthResult }>('/api/me', {
    nickname,
  });
  return res.data;
}
