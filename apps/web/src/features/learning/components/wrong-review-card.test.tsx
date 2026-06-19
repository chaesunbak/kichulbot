import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { WrongReviewCard } from '@/features/learning/components/wrong-review-card';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const stats = {
  accuracyRate: 60,
  correctCount: 3,
  incorrectCount: 1,
  omittedCount: 1,
  totalCount: 5,
};

describe('WrongReviewCard', () => {
  it('오답 문항이 있으면 오답 복습 버튼을 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <WrongReviewCard
        stats={stats}
        wrongReview={{
          questionSetId: 'daily_wrong_1',
          questionCount: 2,
          generatedAt: '2026-06-19T00:00:00.000Z',
        }}
      />,
    );

    expect(html).toContain('오답 복습하기');
    expect(html).not.toContain('새 문제 풀기');
  });

  it('오답 문항이 없으면 새 문제 풀기 링크를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <WrongReviewCard
        stats={{ ...stats, accuracyRate: 0, totalCount: 0 }}
        wrongReview={{
          questionSetId: null,
          questionCount: 0,
          generatedAt: null,
        }}
      />,
    );

    expect(html).toContain('새 문제 풀기');
    expect(html).not.toContain('오답 복습하기');
  });
});
