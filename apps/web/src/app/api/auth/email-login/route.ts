import type { NextRequest } from 'next/server';

import { withAuth } from '@/features/auth/lib/with-auth';
import { forwardAuthSessionRequest } from '@/shared/lib/api-bff-forwarder';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

const configureEmailLogin = withAuth(async (request, { auth }) =>
  forwardAuthSessionRequest(request, '/me/email-login', undefined, auth.token),
);

export async function PATCH(request: NextRequest) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  return configureEmailLogin(request);
}
