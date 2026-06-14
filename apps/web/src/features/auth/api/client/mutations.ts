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
  return clientApi.post<AuthResult>('/api/auth/login', body);
}

export async function requestPasswordResetApi(
  email: string,
): Promise<PasswordResetIssueResponse> {
  return clientApi.post<PasswordResetIssueResponse>(
    '/api/auth/password-reset-requests',
    { email },
  );
}

export async function confirmPasswordResetApi(body: {
  token: string;
  password: string;
}): Promise<PasswordResetConfirmResponse> {
  return clientApi.post<PasswordResetConfirmResponse>(
    '/api/auth/password-resets/confirm',
    body,
  );
}

export async function requestEmailVerificationApi(
  email: string,
): Promise<EmailVerificationIssueResponse> {
  return clientApi.post<EmailVerificationIssueResponse>(
    '/api/auth/email-verifications',
    { email },
  );
}

export async function confirmEmailVerificationApi(body: {
  email: string;
  code: string;
}): Promise<EmailVerificationConfirmResponse> {
  return clientApi.post<EmailVerificationConfirmResponse>(
    '/api/auth/email-verifications/confirm',
    body,
  );
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
