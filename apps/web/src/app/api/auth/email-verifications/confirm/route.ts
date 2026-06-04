import { ApiError, serverApi } from '@/shared/api/server';
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
        emailVerificationToken: string;
      };
    }>('/auth/email-verifications/confirm', body);
    return Response.json(res.data);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, 'Internal server error');
  }
}
