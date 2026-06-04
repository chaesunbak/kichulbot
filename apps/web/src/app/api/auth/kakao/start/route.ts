import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { COOKIE_NAME } from '@/features/auth/server';
import { authErrorResponse } from '@/shared/lib/route-helpers';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
const OAUTH_NEXT_COOKIE_NAME = 'kichulbot_oauth_next';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode');
  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get('next'));
  const url = new URL(`${API_BASE_URL}/auth/kakao`);
  if (mode === 'link') {
    url.searchParams.set('mode', mode);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const response = await fetch(url, {
    headers,
    redirect: 'manual',
  });
  const location = response.headers.get('location');

  if (!location) {
    return authErrorResponse(502, '카카오 로그인 시작에 실패했습니다.');
  }

  const redirectResponse = NextResponse.redirect(location);
  if (mode !== 'link') {
    redirectResponse.cookies.set(OAUTH_NEXT_COOKIE_NAME, nextPath, {
      path: '/',
      maxAge: 60 * 5,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return redirectResponse;
}
