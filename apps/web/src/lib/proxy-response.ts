import { NextResponse } from 'next/server';
import { ApiError } from './api';

export function proxyErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status === 0 ? 502 : error.status },
    );
  }
  return NextResponse.json(
    { message: '요청 처리 중 오류가 발생했습니다.' },
    { status: 500 },
  );
}
