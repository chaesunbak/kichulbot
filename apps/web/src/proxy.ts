import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { verifyAccessToken } from '@/features/auth/lib/jwt';

const AUTH_COOKIE_NAME = 'kichulbot_token';
const PROTECTED_PATH_PREFIXES = [
  '/library',
  '/logs',
  '/mock-exams',
  '/my',
  '/recap',
  '/report',
  '/results',
  '/solve',
  '/streak',
];

export async function proxy(request: NextRequest) {
  if (matchesPathPrefix(request.nextUrl.pathname, PROTECTED_PATH_PREFIXES)) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    const result = token ? await verifyAccessToken(token) : null;

    if (!result?.ok) {
      const url = request.nextUrl.clone();
      const nextPath = `${url.pathname}${url.search}`;
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('next', nextPath);

      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

function matchesPathPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
