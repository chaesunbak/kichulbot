import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { proxyErrorResponse } from '@/lib/proxy-response';

export async function GET() {
  const token = await getToken();
  if (!token)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  try {
    const response = await api.get<{ data: unknown }>(
      '/library/bookshelves',
      token,
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return proxyErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const token = await getToken();
  if (!token)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  try {
    const response = await api.post<{ data: unknown }>(
      '/library/bookshelves',
      await request.json(),
      token,
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
