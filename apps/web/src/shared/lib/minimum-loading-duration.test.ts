import { afterEach, describe, expect, it, vi } from 'vitest';

import { withMinimumLoadingDuration } from '@/shared/lib/minimum-loading-duration';

afterEach(() => {
  vi.useRealTimers();
});

describe('withMinimumLoadingDuration', () => {
  it('작업이 바로 끝나도 최소 시간이 지나기 전에는 완료하지 않는다', async () => {
    vi.useFakeTimers();

    let isSettled = false;
    const task = withMinimumLoadingDuration(Promise.resolve('완료'), 400);
    task.then(() => {
      isSettled = true;
    });

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(399);

    expect(isSettled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);

    await expect(task).resolves.toBe('완료');
    expect(isSettled).toBe(true);
  });

  it('작업 결과값을 그대로 반환한다', async () => {
    vi.useFakeTimers();

    const result = withMinimumLoadingDuration(
      Promise.resolve({ id: 'note_1' }),
    );

    await vi.advanceTimersByTimeAsync(400);

    await expect(result).resolves.toEqual({ id: 'note_1' });
  });

  it('작업 실패도 최소 시간이 지난 뒤 같은 에러로 전달한다', async () => {
    vi.useFakeTimers();

    const error = new Error('저장하지 못했습니다.');
    let isRejected = false;
    const task = withMinimumLoadingDuration(Promise.reject(error), 400);
    task.catch(() => {
      isRejected = true;
    });

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(399);

    expect(isRejected).toBe(false);

    await vi.advanceTimersByTimeAsync(1);

    await expect(task).rejects.toBe(error);
    expect(isRejected).toBe(true);
  });
});
