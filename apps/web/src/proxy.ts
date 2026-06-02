import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  if (!token && pathname.startsWith('/resources')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
