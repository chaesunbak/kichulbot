import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { proxyErrorResponse } from '@/lib/proxy-response';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookshelfId: string }> },
) {
  const token = await getToken();
  if (!token)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  const { bookshelfId } = await params;
  try {
    const response = await api.patch<{ data: unknown }>(
      `/library/bookshelves/${bookshelfId}`,
      await request.json(),
      token,
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return proxyErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookshelfId: string }> },
) {
  const token = await getToken();
  if (!token)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  const { bookshelfId } = await params;
  try {
    const response = await api.delete<{ data: unknown }>(
      `/library/bookshelves/${bookshelfId}`,
      token,
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
