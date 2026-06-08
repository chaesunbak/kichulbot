import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatDate,
  formatDuration,
  formatRelativeDate,
  formatSolveMode,
} from '@/features/learning/lib/format';

afterEach(() => {
  vi.useRealTimers();
});

describe('formatSolveMode', () => {
  it('풀이 모드 라벨을 반환한다', () => {
    expect(formatSolveMode('ONE_BY_ONE')).toBe('연습모드');
    expect(formatSolveMode('EXAM')).toBe('시험모드');
  });
});

describe('formatDuration', () => {
  it('밀리초를 분/초 라벨로 변환한다', () => {
    expect(formatDuration(0)).toBe('0분 0초');
    expect(formatDuration(61_400)).toBe('1분 1초');
    expect(formatDuration(119_600)).toBe('2분 0초');
  });
});

describe('formatRelativeDate', () => {
  it('현재 시각과의 차이를 상대 시간으로 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T12:00:00.000Z'));

    expect(formatRelativeDate('2026-06-07T11:59:30.000Z')).toBe('방금 전');
    expect(formatRelativeDate('2026-06-07T11:50:00.000Z')).toBe('10분 전');
    expect(formatRelativeDate('2026-06-07T09:00:00.000Z')).toBe('3시간 전');
    expect(formatRelativeDate('2026-06-05T12:00:00.000Z')).toBe('2일 전');
  });
});

describe('formatDate', () => {
  it('잘못된 날짜 값은 대체 문구로 표시한다', () => {
    expect(formatDate('')).toBe('날짜 없음');
    expect(formatDate('invalid-date')).toBe('날짜 없음');
  });
});
