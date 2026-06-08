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
  const origin = normalizeOrigin(request.headers.get('origin'));
  if (!origin || origin === getRequestOrigin(request)) {
    return null;
  }

  return authErrorResponse(403, 'Cross-origin request is not allowed');
}

function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = getForwardedHeaderValue(
    request.headers.get('x-forwarded-host'),
  );

  if (!forwardedHost) {
    return requestUrl.origin;
  }

  const forwardedProto =
    getForwardedHeaderValue(request.headers.get('x-forwarded-proto')) ??
    requestUrl.protocol.replace(':', '');

  return (
    normalizeOrigin(`${forwardedProto}://${forwardedHost}`) ?? requestUrl.origin
  );
}

function getForwardedHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
