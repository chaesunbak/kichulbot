import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const proxy = vi.hoisted(() => ({
  proxyAuthenticatedRequest: vi.fn(),
}));

vi.mock('@/shared/lib/authenticated-proxy', () => ({
  proxyAuthenticatedRequest: proxy.proxyAuthenticatedRequest,
}));

beforeEach(() => {
  vi.clearAllMocks();
  proxy.proxyAuthenticatedRequest.mockResolvedValue(
    Response.json({ ok: true }),
  );
});

describe('/api/[...path]', () => {
  it('모의고사 풀이 세션 생성 요청을 인증 프록시로 전달한다', async () => {
    const request = new Request(
      'https://kichulbot.test/api/me/mock-exams/solve-sessions',
      {
        method: 'POST',
        body: JSON.stringify({ examId: 'exam_1', mode: 'EXAM' }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        path: ['me', 'mock-exams', 'solve-sessions'],
      }),
    });

    expect(response.status).toBe(200);
    expect(proxy.proxyAuthenticatedRequest).toHaveBeenCalledWith(
      request,
      '/me/mock-exams/solve-sessions',
    );
  });
});
