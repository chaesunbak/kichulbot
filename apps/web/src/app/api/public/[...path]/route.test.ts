import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const api = vi.hoisted(() => ({
  serverApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('server-only', () => ({}));

vi.mock('@/shared/api/server', () => ({
  serverApi: api.serverApi,
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.serverApi.post.mockResolvedValue({ data: { ok: true } });
});

describe('/api/public/[...path]', () => {
  it('비로그인 문항 신고 요청을 public API로 전달한다', async () => {
    const body = {
      questionRevisionId: 'revision_1',
      category: 'ANSWER_ERROR',
      content: '정답을 확인해주세요.',
    };
    const request = new Request(
      'https://kichulbot.test/api/public/question-reports/question_1',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        path: ['question-reports', 'question_1'],
      }),
    });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(api.serverApi.post).toHaveBeenCalledWith(
      '/public/question-reports/question_1',
      body,
    );
  });
});
