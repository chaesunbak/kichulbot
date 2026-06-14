import { describe, expect, it } from 'vitest';

import { formatPaperSession, toMetadataValues } from './paper-metadata';

describe('toMetadataValues', () => {
  it('문제지 메타데이터 수정 폼 기본값으로 변환한다', () => {
    expect(
      toMetadataValues({
        title: '2026학년도 6월 모의고사',
        year: 2026,
        round: 3,
      }),
    ).toEqual({
      title: '2026학년도 6월 모의고사',
      year: 2026,
      round: 3,
    });
  });

  it('회차가 없으면 null 폼 값으로 변환한다', () => {
    expect(
      toMetadataValues({
        title: '2026학년도 수능',
        year: 2026,
        round: null,
      }),
    ).toEqual({
      title: '2026학년도 수능',
      year: 2026,
      round: null,
    });
  });
});

describe('formatPaperSession', () => {
  it('회차가 있으면 회차 라벨을 우선 반환한다', () => {
    expect(
      formatPaperSession({
        year: 2026,
        month: 6,
        grade: 3,
        round: 12,
      }),
    ).toBe('제12회');
  });

  it('월과 학년이 있으면 시행 월과 고등학교 학년을 함께 반환한다', () => {
    expect(
      formatPaperSession({
        year: 2026,
        month: 6,
        grade: 3,
        round: null,
      }),
    ).toBe('2026년 6월 고3');
  });

  it('월이 없으면 학년도 라벨을 반환한다', () => {
    expect(
      formatPaperSession({
        year: 2026,
        month: null,
        grade: null,
        round: null,
      }),
    ).toBe('2026학년도');
  });
});
