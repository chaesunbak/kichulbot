'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createLatestWrongQuestionSolveSession } from '@/features/learning/api/client';
import type { WrongReviewStats } from '@/features/learning/lib/recap-stats';
import type { DailyWrongQuestionSet } from '@/features/learning/types';

export function WrongReviewCard({
  initialQuestionSet,
  stats,
}: {
  initialQuestionSet: DailyWrongQuestionSet | null;
  stats: WrongReviewStats;
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
  const questionCount = initialQuestionSet?.questionCount;

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50/40">
      <CardHeader className="pb-3">
        <CardTitle>오답 복습</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-5">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#2563eb ${chartValue * 3.6}deg, #e4e4e7 0deg)`,
            }}
            aria-label={`정답률 ${stats.accuracyRate}%`}
            role="img"
          >
            <div className="grid size-10 place-items-center rounded-full bg-white text-sm font-bold text-blue-700"></div>
          </div>
          <div className="grid flex-1 grid-cols-4 gap-3">
            <WrongReviewStat label="정답률" value={`${stats.accuracyRate}%`} />
            <WrongReviewStat label="정답" value={stats.correctCount} />
            <WrongReviewStat label="오답" value={stats.incorrectCount} />
            <WrongReviewStat label="미응답" value={stats.omittedCount} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isPending || questionCount === 0}
            onClick={() => void start()}
          >
            {isPending ? '준비 중' : '오답 복습하기'}
          </Button>
        </div>
        {questionCount === 0 && (
          <p className="text-xs text-zinc-500">다시 풀 오답이 없습니다.</p>
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
      <div className="truncate text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1 text-lg leading-none font-bold text-zinc-950">
        {value}
      </div>
    </div>
  );
}
