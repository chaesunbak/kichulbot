import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { localApiErrorResponse } from '@/shared/lib/local-api-error-response';

describe('localApiErrorResponse', () => {
  it('지정한 상태 코드와 에러 메시지를 반환한다', async () => {
    const response = localApiErrorResponse(400, '잘못된 요청입니다.');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        statusCode: 400,
        message: '잘못된 요청입니다.',
      },
    });
  });
});
