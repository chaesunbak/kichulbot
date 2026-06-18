import { describe, expect, it } from 'vitest';

import type { AdminExam, AdminTaxonomy } from '@/shared/types';

import {
  getCategoryFormValues,
  getExamFormValues,
  isAdminTag,
} from './form-values';

describe('getCategoryFormValues', () => {
  it('수정 중인 카테고리가 없으면 빈 기본값을 반환한다', () => {
    expect(getCategoryFormValues(null)).toEqual({ name: '' });
  });

  it('수정 중인 카테고리 이름을 기본값으로 반환한다', () => {
    expect(
      getCategoryFormValues({
        id: 'category-1',
        name: '한국사',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      } satisfies AdminTaxonomy),
    ).toEqual({ name: '한국사' });
  });
});

describe('getExamFormValues', () => {
  it('수정 중인 시험이 없으면 시험 폼 기본값을 반환한다', () => {
    expect(getExamFormValues(null)).toEqual({
      name: '',
      slug: '',
      categoryIds: [],
      usesMonth: false,
      usesRound: false,
      mockExamQuestionCount: null,
      eraTagGroupId: null,
      mockExamBlueprintItems: [],
    });
  });

  it('수정 중인 시험을 폼 값으로 변환하고 카테고리 id만 추출한다', () => {
    expect(getExamFormValues(createExam())).toEqual({
      name: '대학수학능력시험',
      slug: 'csat',
      categoryIds: ['category-1', 'category-2'],
      usesMonth: true,
      usesRound: false,
      mockExamQuestionCount: 20,
      eraTagGroupId: 'tag-group-era',
      mockExamBlueprintItems: [
        {
          tagId: 'tag-1',
          minQuestionCount: 1,
          maxQuestionCount: 3,
          sortOrder: 0,
        },
      ],
    });
  });
});

describe('isAdminTag', () => {
  it('관리자 태그 구조에 필요한 필드가 있으면 true를 반환한다', () => {
    expect(isAdminTag({ examId: 'exam-1', tagGroupId: null })).toBe(true);
  });

  it('객체가 아니거나 필수 필드가 없으면 false를 반환한다', () => {
    expect(isAdminTag(null)).toBe(false);
    expect(isAdminTag('tag')).toBe(false);
    expect(isAdminTag({ examId: 'exam-1' })).toBe(false);
  });
});

function createExam(): AdminExam {
  return {
    id: 'exam-1',
    name: '대학수학능력시험',
    slug: 'csat',
    categories: [
      { id: 'category-1', name: '수능' },
      { id: 'category-2', name: '모의고사' },
    ],
    usesMonth: true,
    usesGrade: true,
    usesRound: false,
    isMockExamAvailable: true,
    paperCount: 10,
    mockExamQuestionCount: 20,
    eraTagGroupId: 'tag-group-era',
    mockExamBlueprintItems: [
      {
        tagId: 'tag-1',
        minQuestionCount: 1,
        maxQuestionCount: 3,
        sortOrder: 0,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}
