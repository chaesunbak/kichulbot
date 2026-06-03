import { NextResponse } from 'next/server';

import { serverApi } from '@/shared/api/server';
import { proxyErrorResponse } from '@/shared/lib/proxy-response';
import { rejectCrossOriginRequest } from '@/shared/lib/route-helpers';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function readJsonBody(request: Request) {
  const text = await request.text();
  return text ? (JSON.parse(text) as unknown) : {};
}

async function forwardPublicRequest(path: string, request: Request) {
  switch (request.method) {
    case 'GET':
      return serverApi.get<{ data: unknown }>(path);
    case 'POST':
      return serverApi.post<{ data: unknown }>(
        path,
        await readJsonBody(request),
      );
    default:
      return null;
  }
}

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!SAFE_METHODS.has(request.method)) {
    const originError = rejectCrossOriginRequest(request);
    if (originError) return originError;
  }

  const { path } = await params;
  const url = new URL(request.url);
  const upstreamPath = `/public/${path.join('/')}${url.search}`;

  try {
    const response = await forwardPublicRequest(upstreamPath, request);
    if (!response) {
      return NextResponse.json(
        { message: '허용되지 않은 요청 방식입니다.' },
        { status: 405 },
      );
    }
    return NextResponse.json(response.data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: '요청 본문이 올바른 JSON이 아닙니다.' },
        { status: 400 },
      );
    }
    return proxyErrorResponse(error);
  }
}

export { handler as GET, handler as POST };
