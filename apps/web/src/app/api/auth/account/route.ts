import { ApiError } from '@kichulbot/api-contract';
import { NextResponse } from 'next/server';

import { COOKIE_NAME } from '@/features/auth/lib/auth-cookie';
import { withAuth } from '@/features/auth/lib/with-auth';
import { serverApi } from '@/shared/api/server';
import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

const deleteAccount = withAuth(async (request, { auth }) => {
  try {
    const res = await serverApi.delete<{ data: { ok: true } }>(
      '/me',
      auth.token,
    );
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
});

export async function DELETE(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  return deleteAccount(request);
}
