import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { proxyErrorResponse } from '@/lib/proxy-response';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const token = await getToken();
  if (!token)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  const { id, questionId } = await params;
  try {
    const response = await api.patch<{ data: unknown }>(
      `/answer-sessions/${id}/answers/${questionId}`,
      await request.json(),
      token,
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
