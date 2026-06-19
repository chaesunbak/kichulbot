import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { redirectToLoginIfUnauthorized } from '@/features/auth/lib/auth-redirect';
import {
  getRecapSummary,
  getSolveSessionLogPage,
} from '@/features/learning/api/server/queries';
import { CompactSolveSessionLogList } from '@/features/learning/components/compact-solve-session-log-list';
import { WrongReviewCard } from '@/features/learning/components/wrong-review-card';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function RecapPage() {
  let logPage: Awaited<ReturnType<typeof getSolveSessionLogPage>>;
  let summary: Awaited<ReturnType<typeof getRecapSummary>>;
  try {
    [logPage, summary] = await Promise.all([
      getSolveSessionLogPage({ status: 'all', limit: 5 }),
      getRecapSummary(),
    ]);
  } catch (error) {
    redirectToLoginIfUnauthorized(error, '/recap');
    throw error;
  }

  return (
    <PageContainer>
      <PageTitle>복습</PageTitle>
      <WrongReviewCard
        stats={summary.todayStats}
        wrongReview={summary.wrongReview}
      />
      <Card>
        <CardHeader>
          <CardTitle>나의 학습 분석</CardTitle>
          <CardAction>
            <Button asChild variant="link">
              <Link href="/report">
                확인하기 <ChevronRight />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
      <div className="flex items-center justify-between gap-4">
        <div className="text-lg font-semibold">나의 최근 풀이</div>
        <Button asChild variant="link">
          <Link href="/logs">
            더보기
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
      <CompactSolveSessionLogList
        logs={logPage.logs}
        emptyMessage="아직 풀이 기록이 없습니다."
      />
    </PageContainer>
  );
}
