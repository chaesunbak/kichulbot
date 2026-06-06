import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import {
  getSolveSessionLogPage,
  getSolveSessionLogs,
  getTodayWrongQuestions,
} from '@/features/learning/api/server';
import { SolveSessionLogList } from '@/features/learning/components/solve-session-log-list';
import {
  WrongReviewCard,
  type WrongReviewStats,
} from '@/features/learning/components/wrong-review-card';
import type { SolveSessionLog } from '@/features/learning/types';
import { toKstDateString } from '@/features/question-attempts/lib/streak-date';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function RecapPage() {
  const user = await getCachedUser();
  if (!user) redirect('/login?next=/recap');

  const today = toKstDateString(new Date());
  const [logPage, todayLogs, wrongQuestionSet] = await Promise.all([
    getSolveSessionLogPage({ status: 'all', limit: 5 }),
    getSolveSessionLogs({ status: 'completed', submittedDate: today }),
    getTodayWrongQuestions(),
  ]);
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
          <CardDescription>
            정답률, 풀이량, 취약 태그를 차트로 확인해보세요.
          </CardDescription>
          <Button asChild size="sm" className="mt-3 w-fit">
            <Link href="/report">확인해보세요</Link>
          </Button>
        </CardHeader>
      </Card>
      <div className="flex items-center justify-between gap-4">
        <div className="text-lg font-semibold">나의 최근 풀이</div>
        <Button asChild variant="outline" size="sm">
          <Link href="/log">
            더보기
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
      <SolveSessionLogList
        logs={logPage.logs}
        emptyMessage="아직 풀이 기록이 없습니다."
      />
    </PageContainer>
  );
}

function getTodayStats(logs: SolveSessionLog[]): WrongReviewStats {
  const stats = logs.reduce(
    (acc, log) => {
      if (!log.result) return acc;

      const omittedCount = log.result.totalCount - log.result.answeredCount;
      const incorrectCount = log.result.answeredCount - log.result.correctCount;

      return {
        correctCount: acc.correctCount + log.result.correctCount,
        incorrectCount: acc.incorrectCount + incorrectCount,
        omittedCount: acc.omittedCount + omittedCount,
        totalCount: acc.totalCount + log.result.totalCount,
      };
    },
    {
      correctCount: 0,
      incorrectCount: 0,
      omittedCount: 0,
      totalCount: 0,
    },
  );
  return {
    ...stats,
    accuracyRate:
      stats.totalCount > 0
        ? Math.round((stats.correctCount / stats.totalCount) * 100)
        : 0,
  };
}
