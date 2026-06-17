import { forwardAuthSessionRequest } from '@/shared/lib/api-bff-forwarder';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

export async function POST(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) return originError;

  return forwardAuthSessionRequest(request, '/auth/login');
}
