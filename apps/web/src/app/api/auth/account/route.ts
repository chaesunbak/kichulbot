import { ApiError } from '@kichulbot/api-contract';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/api/server/queries';
import { serverApi } from '@/shared/api/server';
import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

export async function DELETE(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return localApiErrorResponse(401, '로그인이 필요합니다.', request);
  }

  try {
    const res = await serverApi.delete<{ data: { ok: true } }>('/me', token);
    const response = NextResponse.json(res);
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (err) {
    if (err instanceof ApiError) {
      const response = localApiErrorResponse(err.status, err.message, request);
      if (err.status === 401) {
        response.cookies.delete(COOKIE_NAME);
      }
      return response;
    }
    return localApiErrorResponse(500, 'Internal server error', request);
  }
}
