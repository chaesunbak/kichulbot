import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
} from '@kichulbot/api-contract/auth';
import { authRoutes } from '@kichulbot/api-contract/auth';

import { apiRequest } from '@/shared/api/client';

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
