import { ApiError } from '@kichulbot/api-contract';

import { serverApi } from '@/shared/api/server';
import {
  authErrorResponse,
  rejectCrossOriginRequest,
} from '@/shared/lib/route-helpers';

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authErrorResponse(400, 'Invalid request body');
  }

  try {
    const res = await serverApi.post<{
      data: {
        ok: true;
      };
    }>('/auth/email-verifications', body);
    return Response.json(res.data);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, 'Internal server error');
  }
}
