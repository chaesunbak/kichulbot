import { NextResponse } from 'next/server';

import { proxyAuthenticatedRequest } from '@/shared/lib/authenticated-proxy';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const ALLOWED_ROUTES = [
  ['PATCH', /^\/me$/],
  ['GET', /^\/me\/solve-sessions$/],
  ['POST', /^\/me\/solve-sessions$/],
  ['GET', /^\/me\/solve-sessions\/[^/]+$/],
  ['PUT', /^\/me\/solve-sessions\/[^/]+\/answers\/[^/]+$/],
  ['POST', /^\/me\/solve-sessions\/[^/]+\/submissions$/],
  ['GET', /^\/me\/question-lists$/],
  ['POST', /^\/me\/question-lists$/],
  ['GET', /^\/me\/question-lists\/[^/]+$/],
  ['POST', /^\/me\/question-lists\/[^/]+\/solve-sessions$/],
  ['PUT', /^\/me\/question-lists\/[^/]+\/questions\/[^/]+$/],
  ['DELETE', /^\/me\/question-lists\/[^/]+\/questions\/[^/]+$/],
  ['GET', /^\/me\/question-notes\/[^/]+$/],
  ['PUT', /^\/me\/question-notes\/[^/]+$/],
  ['GET', /^\/me\/library$/],
  ['POST', /^\/me\/library\/folders$/],
  ['PATCH', /^\/me\/library\/folders\/[^/]+$/],
  ['DELETE', /^\/me\/library\/folders\/[^/]+$/],
  ['PUT', /^\/me\/library\/exam-papers\/[^/]+$/],
  ['PATCH', /^\/me\/library\/papers\/[^/]+$/],
  ['DELETE', /^\/me\/library\/papers\/[^/]+$/],
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
  proxyRequest as DELETE,
  proxyRequest as GET,
  proxyRequest as PATCH,
  proxyRequest as POST,
  proxyRequest as PUT,
};
