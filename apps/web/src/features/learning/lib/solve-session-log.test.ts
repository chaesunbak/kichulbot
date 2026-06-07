import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatSolveSessionLogCompactMeta,
  formatSolveSessionLogDetailMeta,
  getSolveSessionLogActionLabel,
  getSolveSessionLogHref,
  getSolveSessionLogRelativeDate,
} from '@/features/learning/lib/solve-session-log';
import type { SolveSessionLog } from '@/features/learning/types';

afterEach(() => {
  vi.useRealTimers();
});

function solveSessionLog(
  overrides: Partial<SolveSessionLog> = {},
): SolveSessionLog {
  return {
    id: 'log-1',
    mode: 'EXAM',
    paper: {
      id: 'paper-1',
      title: '2026 기출',
      year: 2026,
      month: 6,
      grade: null,
      round: null,
      questionCount: 20,
      isInLibrary: false,
      exam: { id: 'exam-1', name: '시험' },
    },
    result: null,
    progress: {
      answeredCount: 5,
      totalCount: 20,
      percent: 25,
    },
    submittedAt: null,
    totalSpentMilliseconds: 61_000,
    createdAt: '2026-06-07T10:00:00.000Z',
    updatedAt: '2026-06-07T11:50:00.000Z',
    ...overrides,
  };
}

describe('getSolveSessionLogHref', () => {
  it('제출 여부에 따라 이어 풀기와 결과 경로를 반환한다', () => {
    expect(getSolveSessionLogHref(solveSessionLog())).toBe('/solve/log-1');
    expect(
      getSolveSessionLogHref(
        solveSessionLog({ submittedAt: '2026-06-07T11:00:00.000Z' }),
      ),
    ).toBe('/results/log-1');
  });
});

describe('getSolveSessionLogActionLabel', () => {
  it('제출 여부에 따라 액션 라벨을 반환한다', () => {
    expect(getSolveSessionLogActionLabel(solveSessionLog())).toBe('이어 풀기');
    expect(
      getSolveSessionLogActionLabel(
        solveSessionLog({ submittedAt: '2026-06-07T11:00:00.000Z' }),
      ),
    ).toBe('결과 보기');
  });
});

describe('getSolveSessionLogRelativeDate', () => {
  it('제출 전에는 수정일, 제출 후에는 제출일을 기준으로 상대 시간을 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T12:00:00.000Z'));

    expect(getSolveSessionLogRelativeDate(solveSessionLog())).toBe('10분 전');
    expect(
      getSolveSessionLogRelativeDate(
        solveSessionLog({ submittedAt: '2026-06-07T09:00:00.000Z' }),
      ),
    ).toBe('3시간 전');
  });
});

describe('formatSolveSessionLogCompactMeta', () => {
  it('문항 수, 풀이 모드, 상대 시간을 한 줄 메타로 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T12:00:00.000Z'));

    expect(formatSolveSessionLogCompactMeta(solveSessionLog())).toBe(
      '20 문항 · 시험모드 · 10분 전',
    );
  });
});

describe('formatSolveSessionLogDetailMeta', () => {
  it('풀이 중인 로그는 누적 시간과 풀이 중 상태를 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T12:00:00.000Z'));

    expect(formatSolveSessionLogDetailMeta(solveSessionLog())).toBe(
      '시험모드 · 1분 1초 · 풀이 중 · 10분 전',
    );
  });

  it('제출한 로그는 점수, 정답 수, 소요 시간을 반환한다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-07T12:00:00.000Z'));

    expect(
      formatSolveSessionLogDetailMeta(
        solveSessionLog({
          mode: 'ONE_BY_ONE',
          submittedAt: '2026-06-07T11:00:00.000Z',
          result: {
            score: 75,
            totalCount: 20,
            answeredCount: 18,
            correctCount: 15,
            wrongCount: 5,
            totalSpentMilliseconds: 125_000,
          },
        }),
      ),
    ).toBe('연습모드 · 75점 · 15/20 정답 · 2분 5초 · 1시간 전');
  });
});
