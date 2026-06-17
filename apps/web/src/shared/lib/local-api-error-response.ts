import { NextResponse } from 'next/server';

export function localApiErrorResponse(
  status: number,
  message: string | string[],
  request?: Request,
  error?: string,
) {
  const requestUrl = request ? new URL(request.url) : null;
  return NextResponse.json(
    {
      success: false,
      error: {
        statusCode: status,
        message,
        ...(error ? { error } : {}),
        path: requestUrl ? `${requestUrl.pathname}${requestUrl.search}` : '',
        timestamp: new Date().toISOString(),
      },
    },
    { status },
  );
}
