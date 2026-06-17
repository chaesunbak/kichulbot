import { describe, expect, it } from 'vitest';

import { getPaperCoverTitleLines } from '@/features/papers/components/paper-cover-card';

describe('getPaperCoverTitleLines', () => {
  it('한국사능력검정시험 제목을 회차, 시험명, 등급으로 나눈다', () => {
    expect(getPaperCoverTitleLines('제78회 한국사능력검정시험 심화')).toEqual([
      '제78회',
      '한국사능력검정시험',
      '심화',
    ]);
  });

  it('지원하지 않는 제목은 원문을 유지한다', () => {
    expect(getPaperCoverTitleLines('2026년 6월 모의고사')).toEqual([
      '2026년 6월 모의고사',
    ]);
  });
});
