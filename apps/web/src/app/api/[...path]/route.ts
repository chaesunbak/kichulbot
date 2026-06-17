import { getCookieToken } from '@/features/auth/api/server/queries';
import { forwardJsonBffRequest } from '@/shared/lib/api-bff-forwarder';
import { rejectCrossOriginRequest } from '@/shared/lib/same-origin-request';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function handleBffRequest(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const upstreamPath = `/${path.map(encodeURIComponent).join('/')}`;
  const upstreamPathWithSearch = `${upstreamPath}${new URL(request.url).search}`;

  if (!SAFE_METHODS.has(request.method)) {
    const originError = rejectCrossOriginRequest(request);
    if (originError) return originError;
  }

  const token = await getCookieToken();
  return forwardJsonBffRequest(request, upstreamPathWithSearch, token);
}

export {
  handleBffRequest as DELETE,
  handleBffRequest as GET,
  handleBffRequest as PATCH,
  handleBffRequest as POST,
  handleBffRequest as PUT,
};
