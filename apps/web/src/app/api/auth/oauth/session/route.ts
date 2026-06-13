import { ApiError } from '@kichulbot/api-contract';
import type { NextRequest } from 'next/server';

import { serverApi } from '@/shared/api/server';
import type { AuthResponse } from '@/shared/lib/route-helpers';
import {
  authErrorResponse,
  authSuccessResponse,
  rejectCrossOriginRequest,
} from '@/shared/lib/route-helpers';

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authErrorResponse(400, 'Invalid request body');
  }

  const code =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>).code
      : null;
  if (typeof code !== 'string' || !code.trim()) {
    return authErrorResponse(400, 'OAuth 인증 코드가 필요합니다.');
  }

  try {
    const res = await serverApi.post<AuthResponse>('/auth/oauth/exchange', {
      code,
    });
    return authSuccessResponse(res.data.user, res.data.accessToken);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(401, 'OAuth 인증 정보가 유효하지 않습니다.');
  }
}
