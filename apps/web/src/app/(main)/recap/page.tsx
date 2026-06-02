import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  getSolveSessionLogPage,
  getTodayWrongQuestions,
} from '@/features/learning/api/server';
import { SolveSessionLogList } from '@/features/learning/components/solve-session-log-list';
import { WrongReviewCard } from '@/features/learning/components/wrong-review-card';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function RecapPage() {
  const [logPage, wrongQuestionSet] = await Promise.all([
    getSolveSessionLogPage({ status: 'completed', limit: 5 }),
    getTodayWrongQuestions(),
  ]);

  return (
    <PageContainer>
      <PageTitle>복습</PageTitle>
      {wrongQuestionSet && (
        <WrongReviewCard initialQuestionSet={wrongQuestionSet} />
      )}
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
        emptyMessage="종료한 풀이가 없습니다."
      />
    </PageContainer>
  );
}
