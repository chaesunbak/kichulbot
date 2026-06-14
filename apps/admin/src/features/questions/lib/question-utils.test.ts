import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';
import { describe, expect, it } from 'vitest';

import { getPercentage } from '../../papers/lib/progress';
import { getImageFileName } from './question-image';
import { findNextQuestionNumber } from './question-number';
import { formatTagOption, getAnswerSummary } from './question-summary';

describe('getImageFileName', () => {
  it('이미지 URL에서 디코딩한 파일명을 반환한다', () => {
    expect(
      getImageFileName(
        '/images/%ED%95%9C%EA%B5%AD%EC%82%AC.webp?cache=1',
        'https://example.com/admin',
      ),
    ).toBe('한국사.webp');
  });

  it('파일명을 찾을 수 없으면 기본 파일명을 반환한다', () => {
    expect(
      getImageFileName('https://example.com/', 'https://example.com'),
    ).toBe('question-image.webp');
  });
});

describe('findNextQuestionNumber', () => {
  it('비어 있는 가장 작은 문항 번호를 반환한다', () => {
    expect(
      findNextQuestionNumber([{ number: 1 }, { number: 3 }, { number: 4 }], 5),
    ).toBe(2);
  });

  it('문항 번호가 모두 차 있으면 다음 번호가 없다고 반환한다', () => {
    expect(
      findNextQuestionNumber([{ number: 1 }, { number: 2 }], 2),
    ).toBeNull();
  });
});

describe('formatTagOption', () => {
  it('태그 그룹이 있으면 그룹 이름과 태그 이름을 함께 반환한다', () => {
    expect(
      formatTagOption({
        id: 'tag-1',
        name: '광종',
        keywords: [],
        sortOrder: 0,
        tagGroup: {
          id: 'group-1',
          examId: 'exam-1',
          name: '고려',
          selectionMode: 'MULTIPLE',
          sortOrder: 0,
          isActive: true,
        },
      } satisfies TagResponse),
    ).toBe('고려 · 광종');
  });

  it('태그 그룹이 없으면 태그 이름만 반환한다', () => {
    expect(
      formatTagOption({
        id: 'tag-1',
        name: '광종',
        keywords: [],
        sortOrder: 0,
        tagGroup: null,
      } satisfies TagResponse),
    ).toBe('광종');
  });
});

describe('getAnswerSummary', () => {
  it('정답 없음 객관식 요약을 반환한다', () => {
    expect(
      getAnswerSummary(
        createQuestion({
          type: 'MULTIPLE_CHOICE',
          gradingPolicy: 'ANY_CHOICE',
          choiceCount: 5,
        }),
      ),
    ).toBe('정답없음 · 선택지 5개');
  });

  it('객관식 정답과 선택지 수 요약을 반환한다', () => {
    expect(
      getAnswerSummary(
        createQuestion({
          type: 'MULTIPLE_CHOICE',
          gradingPolicy: 'EXACT',
          answerChoice: 3,
          choiceCount: 5,
        }),
      ),
    ).toBe('정답 3번 · 선택지 5개');
  });

  it('주관식 모범답안 요약을 반환한다', () => {
    expect(
      getAnswerSummary(
        createQuestion({
          type: 'WRITTEN',
          answerText: '광종',
        }),
      ),
    ).toBe('모범답안 광종');
  });
});

describe('getPercentage', () => {
  it('전체 값이 0 이하이면 0을 반환한다', () => {
    expect(getPercentage(10, 0)).toBe(0);
  });

  it('백분율을 계산하고 100을 넘지 않도록 제한한다', () => {
    expect(getPercentage(3, 4)).toBe(75);
    expect(getPercentage(5, 4)).toBe(100);
  });
});

function createQuestion(
  overrides: Partial<AdminPaperQuestionResponse> = {},
): AdminPaperQuestionResponse {
  return {
    id: 'question-1',
    number: 1,
    type: 'MULTIPLE_CHOICE',
    imageUrl: 'https://example.com/question.webp',
    imageCacheKey: 'question.webp',
    choiceCount: 5,
    gradingPolicy: 'EXACT',
    answerChoice: 1,
    answerText: null,
    explanation: null,
    rawText: '',
    promptText: '',
    passageText: '',
    choiceTexts: [],
    points: 2,
    recommendedTimeSeconds: null,
    recommendedTagIds: [],
    recommendedTagMatches: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    ...overrides,
  };
}
