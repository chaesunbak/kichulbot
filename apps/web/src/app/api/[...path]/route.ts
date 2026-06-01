import { NextResponse } from 'next/server';
import { proxyAuthenticatedRequest } from '@/lib/authenticated-proxy';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const ALLOWED_ROUTES = [
  ['POST', /^\/answer-sessions$/],
  ['POST', /^\/answer-sessions\/wrong-review$/],
  ['PATCH', /^\/answer-sessions\/[^/]+\/answers\/[^/]+$/],
  ['POST', /^\/answer-sessions\/[^/]+\/submit$/],
  ['GET', /^\/bookmark-lists$/],
  ['POST', /^\/bookmark-lists$/],
  ['POST', /^\/bookmark-lists\/[^/]+\/questions\/[^/]+$/],
  ['DELETE', /^\/bookmark-lists\/[^/]+\/questions\/[^/]+$/],
  ['GET', /^\/library\/bookshelves$/],
  ['POST', /^\/library\/bookshelves$/],
  ['PATCH', /^\/library\/bookshelves\/[^/]+$/],
  ['DELETE', /^\/library\/bookshelves\/[^/]+$/],
  ['POST', /^\/library\/bookshelves\/[^/]+\/papers\/[^/]+$/],
  ['DELETE', /^\/library\/bookshelves\/[^/]+\/papers\/[^/]+$/],
  ['GET', /^\/me\/wrong-questions$/],
  ['POST', /^\/me\/wrong-question-sets\/today\/refresh$/],
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

  if (!isAllowedRoute(request.method, upstreamPath)) {
    return NextResponse.json(
      { message: '존재하지 않는 요청 경로입니다.' },
      { status: 404 },
    );
  }

  return proxyAuthenticatedRequest(request, upstreamPath);
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PATCH,
  proxyRequest as DELETE,
};
