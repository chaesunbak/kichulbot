'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@kichulbot/ui/components/badge';
import { Button } from '@kichulbot/ui/components/button';
import { BookOpenCheck, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';

import { QuestionBookmarkButton } from '@/features/learning/components/question-bookmark-button';
import type {
  Answer,
  SolveSession,
  QuestionResult,
  SolveQuestion,
} from '@/features/learning/types';
import { cn } from '@/shared/lib/utils';

type ResultFilter = 'ALL' | 'WRONG' | 'OMITTED' | 'CORRECT';

const filterLabels: Record<ResultFilter, string> = {
  ALL: '전체',
  WRONG: '오답',
  OMITTED: '미응답',
  CORRECT: '정답',
};

export function ResultSession({ session }: { session: SolveSession }) {
  const [currentId, setCurrentId] = useState(session.paper.questions[0]?.id);
  const [filter, setFilter] = useState<ResultFilter>('ALL');
  const answerByQuestionId = useMemo(
    () => new Map(session.answers.map((answer) => [answer.questionId, answer])),
    [session.answers],
  );
  const questions = session.paper.questions;
  const filteredQuestions = questions.filter((question) =>
    matchesFilter(question, answerByQuestionId.get(question.id), filter),
  );
  const selectedQuestion =
    questions.find((question) => question.id === currentId) ?? questions[0];
  const selectedAnswer = selectedQuestion
    ? answerByQuestionId.get(selectedQuestion.id)
    : undefined;

  const selectFilter = (nextFilter: ResultFilter) => {
    setFilter(nextFilter);
    const firstQuestion = questions.find((question) =>
      matchesFilter(question, answerByQuestionId.get(question.id), nextFilter),
    );
    if (firstQuestion) setCurrentId(firstQuestion.id);
  };

  if (!selectedQuestion || !session.result) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-zinc-500">확인할 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            {session.mode === 'ONE_BY_ONE'
              ? '한 문제씩 풀기 결과'
              : '시험 결과'}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
            {session.paper.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {formatDate(session.submittedAt ?? session.updatedAt)} 제출
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/resources/${session.paper.id}`}>
            <RotateCcw />
            다시 풀기
          </Link>
        </Button>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="점수"
          value={`${session.result.score}점`}
          detail={`${session.result.correctCount}/${session.result.totalCount} 정답`}
        />
        <SummaryTile
          label="오답"
          value={`${session.result.wrongCount}문항`}
          detail="해설을 먼저 확인하세요"
          tone="wrong"
        />
        <SummaryTile
          label="미응답"
          value={`${session.result.totalCount - session.result.answeredCount}문항`}
          detail={`${session.result.answeredCount}문항 응답`}
        />
        <SummaryTile
          label="총 풀이시간"
          value={formatDuration(session.result.totalSpentMilliseconds)}
          detail="제출 시점 기준"
        />
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <BookOpenCheck className="size-4" aria-hidden />
            문항별 채점
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {(Object.keys(filterLabels) as ResultFilter[]).map((item) => (
              <Button
                key={item}
                type="button"
                variant={filter === item ? 'default' : 'outline'}
                size="sm"
                className="px-2"
                onClick={() => selectFilter(item)}
              >
                {filterLabels[item]}
              </Button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {filteredQuestions.map((question) => {
              const answer = answerByQuestionId.get(question.id);
              const status = getQuestionStatus(question, answer);
              return (
                <button
                  key={question.id}
                  type="button"
                  className={cn(
                    'h-9 rounded-md border text-sm font-medium',
                    selectedQuestion.id === question.id &&
                      'border-zinc-900 bg-zinc-900 text-white',
                    selectedQuestion.id !== question.id &&
                      status === 'correct' &&
                      'border-emerald-200 bg-emerald-50 text-emerald-700',
                    selectedQuestion.id !== question.id &&
                      status === 'wrong' &&
                      'border-red-200 bg-red-50 text-red-700',
                    selectedQuestion.id !== question.id &&
                      status === 'review' &&
                      'border-blue-200 bg-blue-50 text-blue-700',
                    selectedQuestion.id !== question.id &&
                      status === 'omitted' &&
                      'border-zinc-200 bg-zinc-50 text-zinc-500',
                  )}
                  onClick={() => setCurrentId(question.id)}
                >
                  {question.number}
                </button>
              );
            })}
          </div>
          {filteredQuestions.length === 0 && (
            <p className="mt-4 text-sm text-zinc-500">
              이 조건에 해당하는 문항이 없습니다.
            </p>
          )}
        </aside>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-950">
                  {selectedQuestion.number}번
                </h2>
                <StatusBadge
                  question={selectedQuestion}
                  answer={selectedAnswer}
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                풀이시간{' '}
                {formatDuration(selectedAnswer?.spentMilliseconds ?? 0)}
              </p>
            </div>
            <QuestionBookmarkButton questionId={selectedQuestion.id} />
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-h-[420px] bg-zinc-50 p-3">
              {selectedQuestion.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedQuestion.imageUrl}
                  alt={`${selectedQuestion.number}번 문제`}
                  className="h-full min-h-[396px] w-full rounded-md object-contain"
                />
              ) : (
                <div className="grid min-h-[396px] place-items-center rounded-md bg-white px-4 text-center text-sm text-zinc-500">
                  문제 이미지가 없습니다.
                </div>
              )}
            </div>

            <div className="border-t border-zinc-100 p-4 lg:border-l lg:border-t-0">
              <AnswerBlock
                question={selectedQuestion}
                answer={selectedAnswer}
              />
              {selectedQuestion.result && (
                <QuestionResultPanel result={selectedQuestion.result} />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'wrong';
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-bold text-zinc-950',
          tone === 'wrong' && 'text-red-700',
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function AnswerBlock({
  question,
  answer,
}: {
  question: SolveQuestion;
  answer?: Answer;
}) {
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <p className="text-xs font-medium text-zinc-500">내 답안</p>
        <p className="mt-1 rounded-md bg-zinc-50 px-3 py-2 text-zinc-900">
          {formatUserAnswer(question, answer)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500">정답</p>
        <p className="mt-1 rounded-md bg-emerald-50 px-3 py-2 font-medium text-emerald-800">
          {formatCorrectAnswer(question.result)}
        </p>
      </div>
    </div>
  );
}

function QuestionResultPanel({ result }: { result: QuestionResult }) {
  return (
    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
      <p className="font-semibold text-blue-900">해설</p>
      <p className="mt-2 whitespace-pre-wrap text-blue-800">
        {result.explanation || '등록된 해설이 없습니다.'}
      </p>
    </div>
  );
}

function StatusBadge({
  question,
  answer,
}: {
  question: SolveQuestion;
  answer?: Answer;
}) {
  const status = getQuestionStatus(question, answer);
  if (status === 'correct') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800">
        <CheckCircle2 data-icon="inline-start" />
        정답
      </Badge>
    );
  }
  if (status === 'wrong') {
    return (
      <Badge variant="destructive">
        <XCircle data-icon="inline-start" />
        오답
      </Badge>
    );
  }
  if (status === 'review') return <Badge variant="outline">확인</Badge>;
  return <Badge variant="secondary">미응답</Badge>;
}

function matchesFilter(
  question: SolveQuestion,
  answer: Answer | undefined,
  filter: ResultFilter,
) {
  const status = getQuestionStatus(question, answer);
  return (
    filter === 'ALL' ||
    (filter === 'CORRECT' && status === 'correct') ||
    (filter === 'WRONG' && status === 'wrong') ||
    (filter === 'OMITTED' && status === 'omitted')
  );
}

function getQuestionStatus(question: SolveQuestion, answer?: Answer) {
  if (!hasAnswer(answer)) return 'omitted';
  if (question.result?.isCorrect === true) return 'correct';
  if (question.result?.isCorrect === false) return 'wrong';
  return 'review';
}

function hasAnswer(answer?: Answer) {
  return !!answer && (answer.answerChoice !== null || !!answer.answerText);
}

function formatUserAnswer(question: SolveQuestion, answer?: Answer) {
  if (!hasAnswer(answer)) return '미응답';
  if (question.type === 'MULTIPLE_CHOICE') {
    return answer?.answerChoice ? `${answer.answerChoice}번` : '미응답';
  }
  return answer?.answerText || '미응답';
}

function formatCorrectAnswer(result: QuestionResult | null) {
  if (!result) return '채점 결과 없음';
  return result.answerChoice ? `${result.answerChoice}번` : result.answerText;
}

function formatDuration(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
