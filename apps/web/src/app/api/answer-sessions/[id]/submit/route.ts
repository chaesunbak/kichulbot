import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { proxyErrorResponse } from '@/lib/proxy-response';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  const { id } = await params;
  try {
    const response = await api.post<{ data: unknown }>(
      `/answer-sessions/${id}/submit`,
      {},
      token,
    );
    return NextResponse.json(response.data);
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
