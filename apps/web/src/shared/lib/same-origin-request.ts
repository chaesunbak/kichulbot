import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';

export function rejectCrossOriginRequest(request: Request) {
  const origin = normalizeOrigin(request.headers.get('origin'));
  if (!origin || origin === getRequestOrigin(request)) {
    return null;
  }

  return localApiErrorResponse(
    403,
    'Cross-origin request is not allowed',
    request,
  );
}

function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = getForwardedHeaderValue(
    request.headers.get('x-forwarded-host'),
  );

  if (!forwardedHost) {
    return requestUrl.origin;
  }

  const forwardedProto =
    getForwardedHeaderValue(request.headers.get('x-forwarded-proto')) ??
    requestUrl.protocol.replace(':', '');

  return (
    normalizeOrigin(`${forwardedProto}://${forwardedHost}`) ?? requestUrl.origin
  );
}

function getForwardedHeaderValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
