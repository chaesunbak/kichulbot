import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ConvertAnonymousRequestSchema,
  AuthResponseSchema,
  MeResponseSchema,
} from './dto.js';

export const authRoutes = {
  startAnonymous: {
    method: 'POST',
    path: '/auth/anonymous',
    request: null,
    response: AuthResponseSchema,
  },
  register: {
    method: 'POST',
    path: '/auth/register',
    request: RegisterRequestSchema,
    response: AuthResponseSchema,
  },
  convertAnonymous: {
    method: 'POST',
    path: '/auth/convert',
    request: ConvertAnonymousRequestSchema,
    response: AuthResponseSchema,
  },
  login: {
    method: 'POST',
    path: '/auth/login',
    request: LoginRequestSchema,
    response: AuthResponseSchema,
  },
  me: {
    method: 'GET',
    path: '/auth/me',
    request: null,
    response: MeResponseSchema,
  },
} as const;
