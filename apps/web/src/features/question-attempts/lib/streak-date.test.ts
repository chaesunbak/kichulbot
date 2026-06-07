import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getCurrentWeek,
  getMonthRange,
  normalizeMonth,
  toKstDateString,
} from '@/features/question-attempts/lib/streak-date';

afterEach(() => {
  vi.useRealTimers();
});

describe('toKstDateString', () => {
  it('UTC 시각을 KST 날짜 문자열로 변환한다', () => {
    expect(toKstDateString(new Date('2026-06-06T15:00:00.000Z'))).toBe(
      '2026-06-07',
    );
  });
});

describe('getCurrentWeek', () => {
  it('KST 기준 현재 주의 월요일부터 일요일 범위를 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T03:00:00.000Z'));

    expect(getCurrentWeek()).toEqual({
      today: '2026-06-07',
      from: '2026-06-01',
      to: '2026-06-07',
      week: [
        { label: '월', date: '2026-06-01' },
        { label: '화', date: '2026-06-02' },
        { label: '수', date: '2026-06-03' },
        { label: '목', date: '2026-06-04' },
        { label: '금', date: '2026-06-05' },
        { label: '토', date: '2026-06-06' },
        { label: '일', date: '2026-06-07' },
      ],
    });
  });
});

describe('normalizeMonth', () => {
  it('잘못된 월 입력이면 현재 KST 월을 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-06T15:00:00.000Z'));

    expect(normalizeMonth()).toBe('2026-06');
    expect(normalizeMonth('2026-6')).toBe('2026-06');
    expect(normalizeMonth('2026-07')).toBe('2026-07');
  });
});

describe('getMonthRange', () => {
  it('윤년을 포함해 월 시작일과 마지막일을 반환한다', () => {
    expect(getMonthRange('2024-02')).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
    expect(getMonthRange('2026-06')).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    });
  });
});
