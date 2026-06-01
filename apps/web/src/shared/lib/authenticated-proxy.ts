import { NextResponse } from 'next/server';
import { api } from '@/shared/api/api-client';
import { getToken } from '@/features/auth/server';
import { proxyErrorResponse } from '@/shared/lib/proxy-response';
import { rejectCrossOriginRequest } from '@/shared/lib/route-helpers';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function readJsonBody(request: Request) {
  const text = await request.text();
  return text ? (JSON.parse(text) as unknown) : {};
}

// This is a JSON-only BFF helper, not a general-purpose reverse proxy.
// Add a dedicated handler for multipart, streaming, query forwarding, or
// upstream status and header preservation.
async function forwardRequest(path: string, request: Request, token: string) {
  switch (request.method) {
    case 'GET':
      return api.get<{ data: unknown }>(path, token);
    case 'POST':
      return api.post<{ data: unknown }>(
        path,
        await readJsonBody(request),
        token,
      );
    case 'PATCH':
      return api.patch<{ data: unknown }>(
        path,
        await readJsonBody(request),
        token,
      );
    case 'PUT':
      return api.put<{ data: unknown }>(
        path,
        await readJsonBody(request),
        token,
      );
    case 'DELETE':
      return api.delete<{ data: unknown }>(path, token);
    default:
      return null;
  }
}

export async function proxyAuthenticatedRequest(
  request: Request,
  path: string,
) {
  if (!SAFE_METHODS.has(request.method)) {
    const originError = rejectCrossOriginRequest(request);
    if (originError) return originError;
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }

  try {
    const response = await forwardRequest(path, request, token);
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
