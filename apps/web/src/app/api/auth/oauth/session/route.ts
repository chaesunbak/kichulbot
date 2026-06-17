import type { NextRequest } from 'next/server';

import { forwardAuthSessionRequest } from '@/shared/lib/api-bff-forwarder';
import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return localApiErrorResponse(400, 'Invalid request body', request);
  }

  const code =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>).code
      : null;
  if (typeof code !== 'string' || !code.trim()) {
    return localApiErrorResponse(400, 'OAuth 인증 코드가 필요합니다.', request);
  }

  return forwardAuthSessionRequest(request, '/auth/oauth/exchange', { code });
}
