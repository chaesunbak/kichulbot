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
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createWrongQuestionSolveSession,
  refreshWrongQuestionSet,
} from '@/features/learning/api/client';
import type { DailyWrongQuestionSet } from '@/features/learning/types';

export type WrongReviewStats = {
  accuracyRate: number;
  correctCount: number;
  incorrectCount: number;
  omittedCount: number;
  totalCount: number;
};

export function WrongReviewCard({
  initialQuestionSet,
  stats,
}: {
  initialQuestionSet: DailyWrongQuestionSet;
  stats: WrongReviewStats;
}) {
  const router = useRouter();
  const [questionSet, setQuestionSet] = useState(initialQuestionSet);
  const [isPending, setIsPending] = useState(false);
  const didAutoRefresh = useRef(false);

  const start = async () => {
    setIsPending(true);
    try {
      const session = await createWrongQuestionSolveSession({
        questionSetId: questionSet.id,
        mode: 'ONE_BY_ONE',
      });
      router.push(`/solve/${session.id}`);
    } catch {
      toast.error('오답 복습을 시작하지 못했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      setIsPending(true);
      try {
        const nextQuestionSet = await refreshWrongQuestionSet(
          questionSet.studyDate,
        );
        setQuestionSet(nextQuestionSet);
        if (!silent) toast.success('최신 풀이 기록으로 갱신했습니다.');
      } catch {
        if (!silent) toast.error('오늘의 오답을 갱신하지 못했습니다.');
      } finally {
        setIsPending(false);
      }
    },
    [questionSet.studyDate],
  );

  useEffect(() => {
    if (didAutoRefresh.current) return;
    didAutoRefresh.current = true;
    void refresh({ silent: true });
  }, [refresh]);

  const chartValue = stats.totalCount > 0 ? stats.accuracyRate : 0;

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50/40">
      <CardHeader className="pb-3">
        <CardTitle>{questionSet.title}</CardTitle>
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
            disabled={isPending || questionSet.questionCount === 0}
            onClick={() => void start()}
          >
            오답문제 다시 풀기
          </Button>
        </div>
        {questionSet.questionCount === 0 && (
          <p className="text-xs text-zinc-500">오늘 다시 풀 오답이 없습니다.</p>
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
