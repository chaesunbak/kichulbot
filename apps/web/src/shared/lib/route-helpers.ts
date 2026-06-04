import { NextResponse } from 'next/server';

import { COOKIE_NAME, COOKIE_OPTIONS } from '@/features/auth/server';
import type { AuthUser } from '@/features/auth/types';

export interface AuthResponse {
  data: { user: AuthUser; accessToken: string };
}

export function authSuccessResponse(user: AuthUser, accessToken: string) {
  const response = NextResponse.json({ user });
  response.cookies.set(COOKIE_NAME, accessToken, COOKIE_OPTIONS);
  return response;
}

export function authErrorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function rejectCrossOriginRequest(request: Request) {
  const origin = request.headers.get('origin');
  if (origin === new URL(request.url).origin) {
    return null;
  }

  return authErrorResponse(403, 'Cross-origin request is not allowed');
}
