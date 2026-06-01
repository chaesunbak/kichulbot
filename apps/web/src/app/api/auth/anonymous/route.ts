import { api, ApiError } from '@/lib/api';
import {
  AuthResponse,
  authSuccessResponse,
  authErrorResponse,
  rejectCrossOriginRequest,
} from '@/lib/route-helpers';

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  try {
    const res = await api.post<AuthResponse>('/auth/anonymous', {});
    return authSuccessResponse(res.data.user, res.data.accessToken);
  } catch (err) {
    if (err instanceof ApiError) {
      return authErrorResponse(err.status, err.message);
    }
    return authErrorResponse(500, 'Internal server error');
  }
}
