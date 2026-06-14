import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';
import { describe, expect, it } from 'vitest';

import {
  getRecommendedTagKeywords,
  getUnselectedRecommendedTags,
} from './recommended-tags';

describe('getUnselectedRecommendedTags', () => {
  it('추천 순서대로 존재하는 태그만 반환하고 선택된 태그는 제외한다', () => {
    const tags = [
      createTag({ id: 'tag-1', name: '삼국 시대' }),
      createTag({ id: 'tag-2', name: '고려' }),
      createTag({ id: 'tag-3', name: '조선' }),
    ];

    expect(
      getUnselectedRecommendedTags({
        question: createQuestion({
          recommendedTagIds: ['tag-3', 'missing-tag', 'tag-1', 'tag-2'],
        }),
        tags,
        selectedTagIds: ['tag-1'],
      }).map((tag) => tag.id),
    ).toEqual(['tag-3', 'tag-2']);
  });
});

describe('getRecommendedTagKeywords', () => {
  it('저장된 추천 매칭 키워드가 있으면 본문 재계산보다 우선한다', () => {
    expect(
      getRecommendedTagKeywords(
        createQuestion({
          rawText: '고려 광종은 노비안검법을 실시하였다.',
          recommendedTagMatches: [
            { tagId: 'tag-1', keywords: ['저장된 키워드'] },
          ],
        }),
        createTag({
          id: 'tag-1',
          keywords: ['광종', '노비안검법'],
        }),
      ),
    ).toEqual(['저장된 키워드']);
  });

  it('저장된 매칭이 없으면 문항 텍스트에서 공백과 대소문자를 무시해 키워드를 찾는다', () => {
    expect(
      getRecommendedTagKeywords(
        createQuestion({
          rawText: '',
          promptText: '다음 정책을 시행한 왕은?',
          passageText: '노비 안검법을 실시하였다.',
          choiceTexts: ['광종', '성종'],
          recommendedTagMatches: [],
        }),
        createTag({
          id: 'tag-1',
          keywords: ['노비안검법', 'GWANGJONG', ''],
        }),
      ),
    ).toEqual(['노비안검법']);
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

function createTag(overrides: Partial<TagResponse> = {}): TagResponse {
  return {
    id: 'tag-1',
    name: '태그',
    keywords: [],
    sortOrder: 0,
    tagGroup: null,
    ...overrides,
  };
}
