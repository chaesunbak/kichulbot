import type {
  AuthResponse,
  ConfirmEmailVerificationRequest,
  EmailVerificationConfirmResponse,
  EmailVerificationIssueResponse,
  EmailVerificationRequest,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from '@kichulbot/api-contract/auth';
import { authRoutes } from '@kichulbot/api-contract/auth';
import * as Linking from 'expo-linking';

import { apiRequest } from '@/shared/api/client';
import { env } from '@/shared/lib/env';

export function login(body: LoginRequest) {
  return apiRequest<AuthResponse>(
    authRoutes.login.path,
    authRoutes.login.response,
    {
      method: authRoutes.login.method,
      body,
    },
  );
}

export function getMe(accessToken: string) {
  return apiRequest<MeResponse>(authRoutes.me.path, authRoutes.me.response, {
    method: authRoutes.me.method,
    token: accessToken,
  });
}

export function register(body: RegisterRequest) {
  return apiRequest<AuthResponse>(
    authRoutes.register.path,
    authRoutes.register.response,
    {
      method: authRoutes.register.method,
      body,
    },
  );
}

export function requestEmailVerification(body: EmailVerificationRequest) {
  return apiRequest<EmailVerificationIssueResponse>(
    authRoutes.requestEmailVerification.path,
    authRoutes.requestEmailVerification.response,
    {
      method: authRoutes.requestEmailVerification.method,
      body,
    },
  );
}

export function confirmEmailVerification(
  body: ConfirmEmailVerificationRequest,
) {
  return apiRequest<EmailVerificationConfirmResponse>(
    authRoutes.confirmEmailVerification.path,
    authRoutes.confirmEmailVerification.response,
    {
      method: authRoutes.confirmEmailVerification.method,
      body,
    },
  );
}

export function getKakaoLoginUrl() {
  const url = new URL(`${env.apiBaseUrl}/auth/kakao`);
  url.searchParams.set('redirectUrl', Linking.createURL('oauth/callback'));
  return url.toString();
}

export function parseOAuthCallbackUrl(url: string) {
  const parsedUrl = Linking.parse(url);
  const accessToken = parsedUrl.queryParams?.accessToken;
  const oauthStatus = parsedUrl.queryParams?.oauth;

  return {
    accessToken: typeof accessToken === 'string' ? accessToken : null,
    oauthStatus: typeof oauthStatus === 'string' ? oauthStatus : null,
  };
}
