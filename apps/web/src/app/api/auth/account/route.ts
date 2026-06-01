import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/features/auth/server';
import { ApiError, serverApi } from '@/shared/api/server';
import {
  authErrorResponse,
  rejectCrossOriginRequest,
} from '@/shared/lib/route-helpers';

export async function DELETE(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return authErrorResponse(401, '로그인이 필요합니다.');
  }

  try {
    await serverApi.delete('/me', token);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, 'Internal server error');
  }
}
