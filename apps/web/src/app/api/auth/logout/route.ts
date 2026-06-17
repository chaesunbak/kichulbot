import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/lib/auth-cookie';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const response = NextResponse.json({ success: true, data: { ok: true } });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
