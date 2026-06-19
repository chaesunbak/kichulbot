'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createLatestWrongQuestionSolveSession } from '@/features/learning/api/client/mutations';
import type {
  RecapTodayStats,
  RecapWrongReview,
} from '@/features/learning/types';

export function WrongReviewCard({
  stats,
  wrongReview,
}: {
  stats: RecapTodayStats;
  wrongReview: RecapWrongReview;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const start = async () => {
    setIsPending(true);
    try {
      const session = await createLatestWrongQuestionSolveSession({
        mode: 'ONE_BY_ONE',
      });
      router.push(`/solve/${session.id}`);
    } catch {
      toast.error('오답 복습을 시작하지 못했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const chartValue = stats.totalCount > 0 ? stats.accuracyRate : 0;
  const questionCount = wrongReview.questionCount;
  const hasWrongQuestions = (questionCount ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>오답 복습</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-5">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--primary) ${chartValue * 3.6}deg, var(--muted) 0deg)`,
            }}
            aria-label={`정답률 ${stats.accuracyRate}%`}
            role="img"
          >
            <div className="grid size-10 place-items-center rounded-full bg-card text-sm font-bold text-primary"></div>
          </div>
          <div className="grid flex-1 grid-cols-4 gap-3">
            <WrongReviewStat label="정답률" value={`${stats.accuracyRate}%`} />
            <WrongReviewStat label="정답" value={stats.correctCount} />
            <WrongReviewStat label="오답" value={stats.incorrectCount} />
            <WrongReviewStat label="미응답" value={stats.omittedCount} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasWrongQuestions ? (
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => void start()}
            >
              {isPending ? '준비 중' : '오답 복습하기'}
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/resources">새 문제 풀기</Link>
            </Button>
          )}
        </div>
        {!hasWrongQuestions && (
          <p className="text-xs text-muted-foreground">
            오늘 다시 풀 오답이 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function WrongReviewStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg leading-none font-bold text-foreground">
        {value}
      </div>
    </div>
  );
}
