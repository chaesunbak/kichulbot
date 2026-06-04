import type { NextRequest } from 'next/server';

import type { AuthUser } from '@/features/auth/types';
import { serverApi } from '@/shared/api/server';
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

  const accessToken =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>).accessToken
      : null;
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    return authErrorResponse(400, 'accessToken이 필요합니다.');
  }

  try {
    const res = await serverApi.get<{ data: { user: AuthUser } }>(
      '/me',
      accessToken,
    );
    return authSuccessResponse(res.data.user, accessToken);
  } catch {
    return authErrorResponse(401, 'OAuth 인증 정보가 유효하지 않습니다.');
  }
}
