'use client';

import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createWrongQuestionSolveSession,
  refreshWrongQuestionSet,
} from '@/features/learning/api/client';
import type { DailyWrongQuestionSet } from '@/features/learning/types';

export function WrongReviewCard({
  initialQuestionSet,
}: {
  initialQuestionSet: DailyWrongQuestionSet;
}) {
  const router = useRouter();
  const [questionSet, setQuestionSet] = useState(initialQuestionSet);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const didAutoRefresh = useRef(false);

  const start = async () => {
    setIsPending(true);
    setMessage(null);
    try {
      const session = await createWrongQuestionSolveSession({
        questionSetId: questionSet.id,
        mode: 'ONE_BY_ONE',
      });
      router.push(`/solve/${session.id}`);
    } catch {
      setMessage('오답 복습을 시작하지 못했습니다.');
      setIsPending(false);
    }
  };

  const refresh = useCallback(
    async ({ silent = false } = {}) => {
      setIsPending(true);
      if (!silent) setMessage(null);
      try {
        const nextQuestionSet = await refreshWrongQuestionSet(
          questionSet.studyDate,
        );
        setQuestionSet(nextQuestionSet);
        if (!silent) setMessage('최신 풀이 기록으로 갱신했습니다.');
      } catch {
        if (!silent) setMessage('오늘의 오답을 갱신하지 못했습니다.');
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

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50/40">
      <CardHeader>
        <CardTitle>{questionSet.title}</CardTitle>
        <CardDescription>
          최근 풀이 기준으로 다시 확인할 문제 {questionSet.questionCount}개
        </CardDescription>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={isPending || questionSet.questionCount === 0}
            onClick={() => void start()}
          >
            오답 다시 풀기
          </Button>
        </div>
        {questionSet.questionCount === 0 && (
          <p className="text-xs text-zinc-500">오늘 다시 풀 오답이 없습니다.</p>
        )}
        {message && <p className="text-xs text-zinc-500">{message}</p>}
      </CardHeader>
    </Card>
  );
}
