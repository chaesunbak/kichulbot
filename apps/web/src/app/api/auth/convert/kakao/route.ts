import type { NextRequest } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/server';
import { ApiError, serverApi } from '@/shared/api/server';
import type { AuthResponse } from '@/shared/lib/route-helpers';
import {
  authErrorResponse,
  authSuccessResponse,
  rejectCrossOriginRequest,
} from '@/shared/lib/route-helpers';

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return authErrorResponse(401, '로그인이 필요합니다.');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authErrorResponse(400, 'Invalid request body');
  }

  try {
    const res = await serverApi.post<AuthResponse>(
      '/auth/convert/kakao',
      body,
      token,
    );
    return authSuccessResponse(res.data.user, res.data.accessToken);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, 'Internal server error');
  }
}
