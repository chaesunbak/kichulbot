import { describe, expect, it } from 'vitest';

import {
  countAttemptsByDate,
  countSolvedDatesInWeek,
  getCurrentStreakDays,
  getLongestStreakDays,
  getSolvedDates,
} from '@/features/question-attempts/lib/streak-summary';
import type { QuestionAttempt } from '@/features/question-attempts/types';

function attempt(gradedAt: string): QuestionAttempt {
  return {
    id: `attempt-${gradedAt}`,
    sessionItemId: null,
    questionRevisionId: 'revision-1',
    questionId: 'question-1',
    answerChoice: 1,
    answerText: null,
    outcome: 'CORRECT',
    spentMilliseconds: 1000,
    gradedAt,
  };
}

describe('streak summary', () => {
  it('KST 기준 풀이 날짜 집합을 만든다', () => {
    expect(
      getSolvedDates([
        attempt('2026-06-06T14:59:59.000Z'),
        attempt('2026-06-06T15:00:00.000Z'),
      ]),
    ).toEqual(new Set(['2026-06-06', '2026-06-07']));
  });

  it('오늘부터 연속 풀이 일수를 계산한다', () => {
    expect(
      getCurrentStreakDays(
        '2026-06-07',
        new Set(['2026-06-04', '2026-06-05', '2026-06-06', '2026-06-07']),
      ),
    ).toBe(4);

    expect(
      getCurrentStreakDays('2026-06-07', new Set(['2026-06-05', '2026-06-06'])),
    ).toBe(0);
  });

  it('가장 긴 연속 풀이 일수를 계산한다', () => {
    expect(
      getLongestStreakDays(
        new Set([
          '2026-06-01',
          '2026-06-02',
          '2026-06-04',
          '2026-06-05',
          '2026-06-06',
        ]),
      ),
    ).toBe(3);
  });

  it('날짜별 풀이 횟수를 계산한다', () => {
    expect(
      countAttemptsByDate([
        attempt('2026-06-06T15:00:00.000Z'),
        attempt('2026-06-06T16:00:00.000Z'),
        attempt('2026-06-07T16:00:00.000Z'),
      ]),
    ).toEqual({
      '2026-06-07': 2,
      '2026-06-08': 1,
    });
  });

  it('같은 날 여러 번 풀어도 주간 학습일은 1일로 계산한다', () => {
    const solvedDates = getSolvedDates([
      attempt('2026-06-15T01:00:00.000Z'),
      attempt('2026-06-15T02:00:00.000Z'),
      attempt('2026-06-16T01:00:00.000Z'),
    ]);

    expect(
      countSolvedDatesInWeek(
        [
          { date: '2026-06-15' },
          { date: '2026-06-16' },
          { date: '2026-06-17' },
          { date: '2026-06-18' },
          { date: '2026-06-19' },
          { date: '2026-06-20' },
          { date: '2026-06-21' },
        ],
        solvedDates,
      ),
    ).toBe(2);
  });
});
