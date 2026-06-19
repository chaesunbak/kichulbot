import { describe, expect, it } from 'vitest';

import {
  getRecapTrendPoints,
  getRecapWeaknessGroups,
  getTodayStats,
  isCompletedSolveSessionLog,
} from '@/features/learning/lib/recap-stats';
import type { SolveSessionLog } from '@/features/learning/types';
import type {
  QuestionAttempt,
  QuestionAttemptTagGroup,
} from '@/features/question-attempts/types';

function log(
  id: string,
  submittedAt: string | null,
  result: SolveSessionLog['result'],
): SolveSessionLog {
  return {
    id,
    mode: 'EXAM',
    paper: {
      id: 'paper-1',
      title: '기출 문제',
      year: 2026,
      month: 6,
      grade: null,
      round: null,
      questionCount: result?.totalCount ?? 0,
      isInLibrary: false,
      exam: { id: 'exam-1', name: '시험' },
    },
    result,
    progress: {
      answeredCount: result?.answeredCount ?? 0,
      totalCount: result?.totalCount ?? 0,
      percent: 0,
    },
    submittedAt,
    totalSpentMilliseconds: result?.totalSpentMilliseconds ?? 0,
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z',
  };
}

const activeGroup = {
  id: 'group-active',
  examId: 'exam-1',
  name: '단원',
  selectionMode: 'MULTIPLE',
  sortOrder: 1,
  isActive: true,
} satisfies QuestionAttemptTagGroup;

const inactiveGroup = {
  ...activeGroup,
  id: 'group-inactive',
  name: '비활성',
  isActive: false,
} satisfies QuestionAttemptTagGroup;

function attempt(
  id: string,
  outcome: QuestionAttempt['outcome'],
  tagName: string,
  group: QuestionAttemptTagGroup | null = activeGroup,
): QuestionAttempt {
  return {
    id,
    sessionItemId: null,
    questionRevisionId: 'revision-1',
    questionId: 'question-1',
    answerChoice: null,
    answerText: null,
    outcome,
    spentMilliseconds: 1000,
    gradedAt: '2026-06-07T00:00:00.000Z',
    tags: [
      {
        id: `tag-${tagName}`,
        name: tagName,
        tagGroup: group,
      },
    ],
  };
}

describe('isCompletedSolveSessionLog', () => {
  it('제출 시각과 결과가 모두 있는 로그만 완료로 판단한다', () => {
    const result = {
      score: 30,
      totalCount: 5,
      answeredCount: 4,
      correctCount: 3,
      wrongCount: 2,
      totalSpentMilliseconds: 1000,
    };

    expect(
      [
        log('log-1', '2026-06-07T00:00:00.000Z', result),
        log('log-2', null, result),
        log('log-3', '2026-06-07T00:00:00.000Z', null),
      ].filter(isCompletedSolveSessionLog),
    ).toEqual([log('log-1', '2026-06-07T00:00:00.000Z', result)]);
  });
});

describe('getTodayStats', () => {
  it('제출 결과가 있는 로그만 오늘 요약에 합산한다', () => {
    expect(
      getTodayStats([
        log('log-1', '2026-06-07T00:00:00.000Z', {
          score: 30,
          totalCount: 5,
          answeredCount: 4,
          correctCount: 3,
          wrongCount: 2,
          totalSpentMilliseconds: 1000,
        }),
        log('log-2', null, null),
      ]),
    ).toEqual({
      accuracyRate: 60,
      correctCount: 3,
      incorrectCount: 1,
      omittedCount: 1,
      totalCount: 5,
    });
  });
});

describe('getRecapTrendPoints', () => {
  it('KST 날짜별 정확도 추이를 오래된 순서로 반환한다', () => {
    expect(
      getRecapTrendPoints([
        log('log-1', '2026-06-06T15:00:00.000Z', {
          score: 0,
          totalCount: 3,
          answeredCount: 3,
          correctCount: 2,
          wrongCount: 1,
          totalSpentMilliseconds: 1000,
        }),
        log('log-2', '2026-06-07T15:00:00.000Z', {
          score: 0,
          totalCount: 2,
          answeredCount: 2,
          correctCount: 1,
          wrongCount: 1,
          totalSpentMilliseconds: 1000,
        }),
      ]),
    ).toEqual([
      {
        date: '2026-06-07',
        label: '6/7',
        accuracyRate: 66.7,
        solvedCount: 3,
        correctCount: 2,
        totalCount: 3,
      },
      {
        date: '2026-06-08',
        label: '6/8',
        accuracyRate: 50,
        solvedCount: 2,
        correctCount: 1,
        totalCount: 2,
      },
    ]);
  });
});

describe('getRecapWeaknessGroups', () => {
  it('활성 태그 그룹만 약점 순서로 집계한다', () => {
    expect(
      getRecapWeaknessGroups([
        attempt('attempt-1', 'INCORRECT', '민법'),
        attempt('attempt-2', 'OMITTED', '민법'),
        attempt('attempt-3', 'CORRECT', '행정법'),
        attempt('attempt-4', 'INCORRECT', '숨김', inactiveGroup),
      ]),
    ).toEqual([
      {
        group: activeGroup,
        tags: [
          {
            tagId: 'tag-민법',
            tagName: '민법',
            weaknessCount: 2,
            weaknessRate: 100,
            accuracyRate: 0,
            correctCount: 0,
            incorrectCount: 1,
            omittedCount: 1,
            totalCount: 2,
          },
          {
            tagId: 'tag-행정법',
            tagName: '행정법',
            weaknessCount: 0,
            weaknessRate: 0,
            accuracyRate: 100,
            correctCount: 1,
            incorrectCount: 0,
            omittedCount: 0,
            totalCount: 1,
          },
        ],
      },
    ]);
  });
});
