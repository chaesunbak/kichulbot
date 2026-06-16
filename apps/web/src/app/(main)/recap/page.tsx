import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { redirectToLoginIfUnauthorized } from '@/features/auth/api/server/redirect';
import {
  getSolveSessionLogPage,
  getSolveSessionLogs,
  getTodayWrongQuestions,
} from '@/features/learning/api/server/queries';
import { CompactSolveSessionLogList } from '@/features/learning/components/compact-solve-session-log-list';
import { WrongReviewCard } from '@/features/learning/components/wrong-review-card';
import { getTodayStats } from '@/features/learning/lib/recap-stats';
import { toKstDateString } from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function RecapPage() {
  const today = toKstDateString(new Date());
  let data: Awaited<ReturnType<typeof loadRecapPageData>>;
  try {
    data = await loadRecapPageData(today);
  } catch (error) {
    redirectToLoginIfUnauthorized(error, '/recap');
    throw error;
  }
  const { logPage, todayLogs, wrongQuestionSet } = data;
  const todayStats = getTodayStats(todayLogs);

  return (
    <PageContainer>
      <PageTitle>복습</PageTitle>
      <WrongReviewCard
        initialQuestionSet={wrongQuestionSet}
        stats={todayStats}
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

async function loadRecapPageData(today: string) {
  const [logPage, todayLogs, wrongQuestionSet] = await Promise.all([
    getSolveSessionLogPage({ status: 'all', limit: 5 }),
    getSolveSessionLogs({ status: 'completed', submittedDate: today }),
    getTodayWrongQuestions(),
  ]);
  return { logPage, todayLogs, wrongQuestionSet };
}
