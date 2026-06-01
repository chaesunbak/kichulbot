'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import type {
  AnswerSession,
  DailyWrongQuestionSet,
} from '@/lib/learning.types';

export function WrongReviewCard({
  initialQuestionSet,
}: {
  initialQuestionSet: DailyWrongQuestionSet;
}) {
  const router = useRouter();
  const [questionSet, setQuestionSet] = useState(initialQuestionSet);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const start = async () => {
    setIsPending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/answer-sessions/wrong-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'ONE_BY_ONE' }),
      });
      if (!response.ok) throw new Error('시작 실패');
      const body = (await response.json()) as { session: AnswerSession };
      router.push(`/solve/${body.session.id}`);
    } catch {
      setMessage('오답 복습을 시작하지 못했습니다.');
      setIsPending(false);
    }
  };

  const refresh = async () => {
    setIsPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        '/api/me/wrong-question-sets/today/refresh',
        { method: 'POST' },
      );
      if (!response.ok) throw new Error('갱신 실패');
      const body = (await response.json()) as {
        questionSet: DailyWrongQuestionSet;
      };
      setQuestionSet(body.questionSet);
      setMessage('최신 풀이 기록으로 갱신했습니다.');
    } catch {
      setMessage('오늘의 오답을 갱신하지 못했습니다.');
    } finally {
      setIsPending(false);
    }
  };

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
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => void refresh()}
          >
            최신 기록으로 갱신
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
