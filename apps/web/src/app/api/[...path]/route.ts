import { NextResponse } from 'next/server';
import { proxyAuthenticatedRequest } from '@/lib/authenticated-proxy';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const ALLOWED_ROUTES = [
  ['GET', /^\/me\/solve-sessions$/],
  ['POST', /^\/me\/solve-sessions$/],
  ['GET', /^\/me\/solve-sessions\/[^/]+$/],
  ['PUT', /^\/me\/solve-sessions\/[^/]+\/answers\/[^/]+$/],
  ['POST', /^\/me\/solve-sessions\/[^/]+\/submissions$/],
  ['GET', /^\/me\/question-lists$/],
  ['POST', /^\/me\/question-lists$/],
  ['GET', /^\/me\/question-lists\/[^/]+$/],
  ['PUT', /^\/me\/question-lists\/[^/]+\/questions\/[^/]+$/],
  ['DELETE', /^\/me\/question-lists\/[^/]+\/questions\/[^/]+$/],
  ['GET', /^\/me\/paper-lists$/],
  ['POST', /^\/me\/paper-lists$/],
  ['PATCH', /^\/me\/paper-lists\/[^/]+$/],
  ['DELETE', /^\/me\/paper-lists\/[^/]+$/],
  ['PUT', /^\/me\/paper-lists\/[^/]+\/exam-papers\/[^/]+$/],
  ['DELETE', /^\/me\/paper-lists\/[^/]+\/exam-papers\/[^/]+$/],
  ['GET', /^\/me\/wrong-question-sets$/],
  ['POST', /^\/me\/wrong-question-sets$/],
  ['POST', /^\/me\/wrong-question-sets\/[^/]+\/solve-sessions$/],
] as const;

function isAllowedRoute(method: string, path: string) {
  return ALLOWED_ROUTES.some(
    ([allowedMethod, pattern]) =>
      allowedMethod === method && pattern.test(path),
  );
}

async function proxyRequest(request: Request, { params }: RouteContext) {
  const { path } = await params;
  const upstreamPath = `/${path.map(encodeURIComponent).join('/')}`;
  const upstreamPathWithSearch = `${upstreamPath}${new URL(request.url).search}`;

  if (!isAllowedRoute(request.method, upstreamPath)) {
    return NextResponse.json(
      { message: '존재하지 않는 요청 경로입니다.' },
      { status: 404 },
    );
  }

  return proxyAuthenticatedRequest(request, upstreamPathWithSearch);
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PATCH,
  proxyRequest as PUT,
  proxyRequest as DELETE,
};
