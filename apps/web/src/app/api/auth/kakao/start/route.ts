import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/api/server/queries';
import { normalizeNextPath } from '@/features/auth/lib/next-path';
import { getInternalApiBaseUrl } from '@/shared/api/base-url';
import { authErrorResponse } from '@/shared/lib/route-helpers';

const OAUTH_NEXT_COOKIE_NAME = 'kichulbot_oauth_next';

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode');
  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get('next'));
  const url = new URL(`${getInternalApiBaseUrl()}/auth/kakao`);
  if (mode === 'link') {
    url.searchParams.set('mode', mode);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      redirect: 'manual',
    });
  } catch {
    return authErrorResponse(502, '백엔드 서버에 연결할 수 없습니다.');
  }

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
