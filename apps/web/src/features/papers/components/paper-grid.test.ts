import { describe, expect, it } from 'vitest';

import { getPaperGridLabels } from '@/features/papers/components/paper-grid';
import type { Paper } from '@/features/papers/types';

describe('getPaperGridLabels', () => {
  it('모바일 라벨은 회차와 등급만 짧게 보여준다', () => {
    const paper = createPaper({
      title: '제78회 한국사능력검정시험 심화',
      round: 78,
      exam: {
        id: 'korean-history-advanced',
        name: '한국사능력검정시험 심화',
      },
    });

    expect(getPaperGridLabels(paper)).toMatchObject({
      title: '제78회 한국사능력검정시험 심화',
      compactTitle: '제78회 심화',
      meta: '한국사능력검정시험 심화 · 제78회',
      compactMeta: '한국사능력검정시험',
    });
  });
});

function createPaper(overrides: Partial<Paper> = {}): Paper {
  return {
    id: 'paper-1',
    title: '제78회 한국사능력검정시험 심화',
    year: 2026,
    month: null,
    grade: null,
    round: 78,
    questionCount: 50,
    isInLibrary: false,
    exam: {
      id: 'exam-1',
      name: '한국사능력검정시험 심화',
    },
    ...overrides,
  };
}
