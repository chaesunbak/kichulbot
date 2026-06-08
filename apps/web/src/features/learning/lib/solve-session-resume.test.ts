import { describe, expect, it } from 'vitest';

import { getResumeQuestionIndex } from '@/features/learning/lib/solve-session-resume';
import type { SolveSession } from '@/features/learning/types';

describe('getResumeQuestionIndex', () => {
  it('저장된 답안이 없으면 1번 문항에서 시작한다', () => {
    expect(getResumeQuestionIndex(createSession({ answers: [] }))).toBe(0);
  });

  it('가장 최근에 저장된 문항에서 이어 시작한다', () => {
    expect(
      getResumeQuestionIndex(
        createSession({
          answers: [
            createAnswer('q1', '2026-06-08T01:00:00.000Z', 1),
            createAnswer('q3', '2026-06-08T01:02:00.000Z', null),
            createAnswer('q2', '2026-06-08T01:01:00.000Z', 2),
          ],
        }),
      ),
    ).toBe(2);
  });

  it('문제지에 없는 답안은 이어풀기 위치 계산에서 제외한다', () => {
    expect(
      getResumeQuestionIndex(
        createSession({
          answers: [
            createAnswer('missing', '2026-06-08T01:03:00.000Z', 1),
            createAnswer('q2', '2026-06-08T01:01:00.000Z', 2),
          ],
        }),
      ),
    ).toBe(1);
  });
});

function createSession({
  answers,
}: {
  answers: SolveSession['answers'];
}): SolveSession {
  return {
    id: 'session-1',
    mode: 'EXAM',
    paper: {
      id: 'paper-1',
      title: '테스트 문제지',
      year: 2026,
      month: null,
      grade: null,
      round: null,
      questionCount: 3,
      isInLibrary: false,
      exam: {
        id: 'exam-1',
        name: '테스트 시험',
      },
      questions: ['q1', 'q2', 'q3'].map((id, index) => ({
        id,
        questionRevisionId: `${id}-revision`,
        number: index + 1,
        type: 'MULTIPLE_CHOICE',
        imageUrl: `https://example.com/${id}.png`,
        imageCacheKey: `${id}-cache`,
        choiceCount: 4,
        points: 1,
        recommendedTimeSeconds: null,
        isBookmarked: false,
        result: null,
      })),
    },
    answers,
    result: null,
    submittedAt: null,
    createdAt: '2026-06-08T00:00:00.000Z',
    updatedAt: '2026-06-08T01:03:00.000Z',
  };
}

function createAnswer(
  questionId: string,
  updatedAt: string,
  answerChoice: number | null,
): SolveSession['answers'][number] {
  return {
    questionId,
    answerChoice,
    answerText: null,
    isCorrect: null,
    spentMilliseconds: 1000,
    updatedAt,
  };
}
