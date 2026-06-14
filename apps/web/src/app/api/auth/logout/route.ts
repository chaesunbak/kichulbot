import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/api/server/queries';
import { rejectCrossOriginRequest } from '@/shared/lib/route-helpers';

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
