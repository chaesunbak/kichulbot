import { ApiError } from '@kichulbot/api-contract';

import { serverApi } from '@/shared/api/server';
import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return localApiErrorResponse(400, 'Invalid request body', request);
  }

  try {
    const res = await serverApi.post<{ data: { ok: true } }>(
      '/auth/password-reset/confirm',
      body,
    );
    return Response.json(res);
  } catch (err) {
    if (err instanceof ApiError) {
      return localApiErrorResponse(err.status, err.message, request);
    }
    return localApiErrorResponse(500, 'Internal server error', request);
  }
}
