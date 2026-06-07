import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/server';
import { proxyErrorResponse } from '@/shared/lib/proxy-response';

describe('proxyErrorResponse', () => {
  it('ApiError의 상태 코드와 메시지를 JSON 응답으로 변환한다', async () => {
    const response = proxyErrorResponse(new ApiError(404, '찾을 수 없습니다.'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: '찾을 수 없습니다.',
    });
  });

  it('네트워크 오류 상태는 502로 변환한다', async () => {
    const response = proxyErrorResponse(
      new ApiError(0, '네트워크 연결을 확인해주세요'),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: '네트워크 연결을 확인해주세요',
    });
  });

  it('알 수 없는 오류는 기본 500 응답으로 변환한다', async () => {
    const response = proxyErrorResponse(new Error('숨겨진 오류'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: '요청 처리 중 오류가 발생했습니다.',
    });
  });
});
