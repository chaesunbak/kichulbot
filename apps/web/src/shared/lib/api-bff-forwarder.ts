import { NextResponse } from 'next/server';

import { COOKIE_NAME, COOKIE_OPTIONS } from '@/features/auth/lib/auth-cookie';
import type { AuthUser } from '@/features/auth/types';
import { getInternalApiBaseUrl } from '@/shared/api/base-url';
import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';

const BASE_URL = getInternalApiBaseUrl();
const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD']);
const FORWARDED_RESPONSE_HEADERS = [
  'location',
  'retry-after',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'cache-control',
  'etag',
  'last-modified',
] as const;

export async function forwardJsonBffRequest(
  request: Request,
  upstreamPath: string,
  token?: string | null,
) {
  const upstream = await fetchUpstream(request, upstreamPath, token);
  if (!upstream) {
    return localApiErrorResponse(
      502,
      '백엔드 서버에 연결할 수 없습니다.',
      request,
      'Bad Gateway',
    );
  }

  return upstreamResponse(upstream);
}

export async function forwardAuthSessionRequest(
  request: Request,
  upstreamPath: string,
  body?: unknown,
  token?: string | null,
) {
  const upstream = await fetchUpstream(
    request,
    upstreamPath,
    token ?? null,
    body,
  );
  if (!upstream) {
    return localApiErrorResponse(
      502,
      '백엔드 서버에 연결할 수 없습니다.',
      request,
      'Bad Gateway',
    );
  }

  if (!upstream.ok) {
    return upstreamResponse(upstream);
  }

  const text = await upstream.text();
  const parsed = parseAuthResponse(text);
  if (!parsed) {
    return localApiErrorResponse(
      502,
      '인증 응답을 처리할 수 없습니다.',
      request,
      'Bad Gateway',
    );
  }

  const response = NextResponse.json(
    { success: true, data: { user: parsed.user } },
    {
      status: upstream.status,
      headers: pickForwardedHeaders(upstream.headers),
    },
  );
  response.cookies.set(COOKIE_NAME, parsed.accessToken, COOKIE_OPTIONS);
  return response;
}

async function fetchUpstream(
  request: Request,
  upstreamPath: string,
  token?: string | null,
  body?: unknown,
) {
  const upstreamBody =
    body === undefined ? await readForwardBody(request) : JSON.stringify(body);

  try {
    return await fetch(`${BASE_URL}${upstreamPath}`, {
      method: request.method,
      headers: createUpstreamHeaders(request, token),
      body: upstreamBody,
      cache: token ? 'no-store' : undefined,
    });
  } catch {
    return null;
  }
}

async function upstreamResponse(upstream: Response) {
  const headers = pickForwardedHeaders(upstream.headers);

  if (upstream.status === 204) {
    const response = new NextResponse(null, {
      status: upstream.status,
      headers,
    });
    clearAuthCookieIfUnauthorized(response, upstream.status);
    return response;
  }

  const body = await upstream.text();
  if (body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = new NextResponse(body || null, {
    status: upstream.status,
    headers,
  });
  clearAuthCookieIfUnauthorized(response, upstream.status);
  return response;
}

function parseAuthResponse(text: string) {
  try {
    const body = JSON.parse(text) as unknown;
    if (!body || typeof body !== 'object') return null;

    const envelope = body as Record<string, unknown>;
    if (envelope.success !== true || !isRecord(envelope.data)) return null;

    const user = envelope.data.user;
    const accessToken = envelope.data.accessToken;
    if (!isAuthUser(user) || typeof accessToken !== 'string') return null;

    return { user, accessToken };
  } catch {
    return null;
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    (typeof value.email === 'string' || value.email === null) &&
    (typeof value.nickname === 'string' || value.nickname === null) &&
    (value.signupMethod === 'EMAIL' || value.signupMethod === 'KAKAO') &&
    Array.isArray(value.authMethods) &&
    value.authMethods.every(
      (authMethod) => authMethod === 'EMAIL' || authMethod === 'KAKAO',
    ) &&
    Array.isArray(value.linkedProviders) &&
    value.linkedProviders.every((provider) => provider === 'KAKAO') &&
    (value.role === 'USER' || value.role === 'ADMIN')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createUpstreamHeaders(request: Request, token?: string | null) {
  const headers = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function readForwardBody(request: Request) {
  if (METHODS_WITHOUT_BODY.has(request.method)) return undefined;

  const body = await request.text();
  return body || undefined;
}

function pickForwardedHeaders(source: Headers) {
  const headers = new Headers();
  FORWARDED_RESPONSE_HEADERS.forEach((name) => {
    const value = source.get(name);
    if (value) headers.set(name, value);
  });
  return headers;
}

function clearAuthCookieIfUnauthorized(response: NextResponse, status: number) {
  if (status === 401) {
    response.cookies.delete(COOKIE_NAME);
  }
}
