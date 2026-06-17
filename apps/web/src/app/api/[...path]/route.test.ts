import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as ApiBffForwarderModule from '@/shared/lib/api-bff-forwarder';

import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  getCookieToken: vi.fn(),
  forwardJsonBffRequest: vi.fn(),
}));

vi.mock('@/features/auth/api/server/queries', () => ({
  getCookieToken: mocks.getCookieToken,
}));

vi.mock('@/shared/lib/api-bff-forwarder', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiBffForwarderModule>();
  return {
    ...actual,
    forwardJsonBffRequest: mocks.forwardJsonBffRequest,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCookieToken.mockResolvedValue('access-token');
  mocks.forwardJsonBffRequest.mockResolvedValue(
    Response.json({ success: true, data: { ok: true } }),
  );
});

describe('/api/[...path]', () => {
  it('모의고사 풀이 세션 생성 요청을 JSON BFF로 전달한다', async () => {
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
    expect(mocks.forwardJsonBffRequest).toHaveBeenCalledWith(
      request,
      '/me/mock-exams/solve-sessions',
      'access-token',
    );
  });

  it('로그인 사용자의 문항 신고 요청을 JSON BFF로 전달한다', async () => {
    const request = new Request(
      'https://kichulbot.test/api/question-reports/question_1',
      {
        method: 'POST',
        body: JSON.stringify({
          questionRevisionId: 'revision_1',
          category: 'ANSWER_ERROR',
          content: '정답을 확인해주세요.',
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        path: ['question-reports', 'question_1'],
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.forwardJsonBffRequest).toHaveBeenCalledWith(
      request,
      '/question-reports/question_1',
      'access-token',
    );
  });

  it('public 풀이 세션 조회 요청도 통합 JSON BFF로 전달한다', async () => {
    mocks.getCookieToken.mockResolvedValue(null);
    const request = new Request(
      'https://kichulbot.test/api/public/solve-sessions/papers/paper_1?mode=EXAM',
    );

    const response = await GET(request, {
      params: Promise.resolve({
        path: ['public', 'solve-sessions', 'papers', 'paper_1'],
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.forwardJsonBffRequest).toHaveBeenCalledWith(
      request,
      '/public/solve-sessions/papers/paper_1?mode=EXAM',
      null,
    );
  });

  it('정의되지 않은 public 요청도 API 서버가 판단하도록 upstream으로 전달한다', async () => {
    const request = new Request('https://kichulbot.test/api/public/exams');

    const response = await GET(request, {
      params: Promise.resolve({
        path: ['public', 'exams'],
      }),
    });

    expect(response.status).toBe(200);
    expect(mocks.forwardJsonBffRequest).toHaveBeenCalledWith(
      request,
      '/public/exams',
      'access-token',
    );
  });

  it('unsafe method의 cross-origin 요청은 upstream으로 전달하지 않는다', async () => {
    const request = new Request('https://kichulbot.test/api/me/profile', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
      },
      body: JSON.stringify({ nickname: '홍길동' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({
        path: ['me', 'profile'],
      }),
    });

    expect(response.status).toBe(403);
    expect(mocks.forwardJsonBffRequest).not.toHaveBeenCalled();
  });
});
