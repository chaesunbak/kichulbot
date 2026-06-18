import type { AuthResponse } from '@kichulbot/api-contract/auth';

export type JwtUser = {
  sub: AuthResponse['user']['id'];
  role: AuthResponse['user']['role'];
  tokenVersion: number;
};

export type RequestUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  role: AuthResponse['user']['role'];
};

export type RequestServiceAccount = {
  id: string;
  name: string;
};
