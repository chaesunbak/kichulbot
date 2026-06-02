import type { NextRequest } from 'next/server';

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authErrorResponse(400, 'Invalid request body');
  }

  try {
    const res = await serverApi.post<AuthResponse>('/auth/login', body);
    return authSuccessResponse(res.data.user, res.data.accessToken);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, 'Internal server error');
  }
}
