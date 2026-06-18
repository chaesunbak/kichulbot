import { describe, expect, it } from 'vitest';

import type { AdminTag,AdminTagGroup } from '@/shared/types';

import {
  getTagFormValues,
  getTagGroupFormValues,
  uniqueKeywords,
} from './form-values';

describe('getTagFormValues', () => {
  it('수정 중인 태그가 없으면 선택한 시험 id로 기본값을 반환한다', () => {
    expect(getTagFormValues(null, 'exam-1')).toEqual({
      name: '',
      keywords: [],
      examId: 'exam-1',
      tagGroupId: null,
      sortOrder: 0,
    });
  });

  it('수정 중인 태그 값을 폼 기본값으로 반환한다', () => {
    expect(getTagFormValues(createTag(), 'other-exam')).toEqual({
      name: '고려',
      keywords: ['광종', '노비안검법'],
      examId: 'exam-1',
      tagGroupId: 'tag-group-1',
      sortOrder: 2,
    });
  });
});

describe('getTagGroupFormValues', () => {
  it('수정 중인 태그 그룹이 없으면 선택한 시험 id로 기본값을 반환한다', () => {
    expect(getTagGroupFormValues(null, 'exam-1')).toEqual({
      examId: 'exam-1',
      name: '',
      selectionMode: 'MULTIPLE',
      sortOrder: 0,
      isActive: true,
    });
  });

  it('수정 중인 태그 그룹 값을 폼 기본값으로 반환한다', () => {
    expect(getTagGroupFormValues(createTagGroup(), 'other-exam')).toEqual({
      examId: 'exam-1',
      name: '시대',
      selectionMode: 'SINGLE',
      sortOrder: 1,
      isActive: false,
    });
  });
});

describe('uniqueKeywords', () => {
  it('키워드 앞뒤 공백과 빈 값을 제거하고 중복을 제거한다', () => {
    expect(uniqueKeywords([' 광종 ', '', '노비안검법', '광종', '  '])).toEqual([
      '광종',
      '노비안검법',
    ]);
  });
});

function createTag(): AdminTag {
  return {
    id: 'tag-1',
    name: '고려',
    keywords: ['광종', '노비안검법'],
    sortOrder: 2,
    tagGroup: null,
    examId: 'exam-1',
    tagGroupId: 'tag-group-1',
    questionCount: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function createTagGroup(): AdminTagGroup {
  return {
    id: 'tag-group-1',
    examId: 'exam-1',
    name: '시대',
    selectionMode: 'SINGLE',
    sortOrder: 1,
    isActive: false,
    tagCount: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}
