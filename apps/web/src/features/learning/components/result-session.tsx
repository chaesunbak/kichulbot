'use client';

import { Badge } from '@kichulbot/ui/components/ui/badge';
import { Button } from '@kichulbot/ui/components/ui/button';
import { BookOpenCheck, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QuestionActions } from '@/features/learning/components/question-actions';
import { formatDate, formatDuration } from '@/features/learning/lib/format';
import type {
  Answer,
  QuestionResult,
  SolveQuestion,
  SolveSession,
} from '@/features/learning/types';
import { cn } from '@/shared/lib/utils';

type ResultFilter = 'ALL' | 'WRONG' | 'OMITTED' | 'CORRECT';

const filterLabels: Record<ResultFilter, string> = {
  ALL: '전체',
  WRONG: '오답',
  OMITTED: '미응답',
  CORRECT: '정답',
};

export function ResultSession({
  session,
  showPersonalActions = true,
  isAuthenticated = true,
}: {
  session: SolveSession;
  showPersonalActions?: boolean;
  isAuthenticated?: boolean;
}) {
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
    <div
      className="
        mx-auto max-w-6xl px-4 py-8
        sm:py-10
      "
    >
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

      <section
        className="
          mt-5 grid gap-2
          sm:grid-cols-4
          lg:grid-cols-4
        "
      >
        <SummaryTile label="점수" value={`${session.result.score}점`} />
        <SummaryTile
          label="오답"
          value={`${session.result.wrongCount}문항`}
          tone="wrong"
        />
        <SummaryTile
          label="미응답"
          value={`${session.result.totalCount - session.result.answeredCount}문항`}
        />
        <SummaryTile
          label="총 풀이시간"
          value={formatDuration(session.result.totalSpentMilliseconds)}
        />
      </section>

      <div
        className="
          mt-8 grid gap-5
          lg:grid-cols-[minmax(0,1fr)_300px]
        "
      >
        <section className="overflow-hidden rounded-lg border bg-card">
          <div
            className="
              flex flex-wrap items-center justify-between gap-3 border-b px-4
              py-3
            "
          >
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
            <div className="flex items-center gap-2">
              <QuestionActions
                questionId={selectedQuestion.id}
                questionRevisionId={selectedQuestion.questionRevisionId}
                showPersonalActions={showPersonalActions}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>

          <div
            className="
              grid gap-0
              lg:grid-cols-[minmax(0,1fr)_320px]
            "
          >
            <div className="min-h-105 bg-zinc-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedQuestion.imageUrl}
                alt={`${selectedQuestion.number}번 문제`}
                className="size-full min-h-99 rounded-md object-contain"
              />
            </div>

            <div
              className="
                border-t p-4
                lg:border-t-0 lg:border-l
              "
            >
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

        <aside
          className="
          h-fit rounded-lg border bg-card p-4
          lg:sticky lg:top-24
        "
        >
          <div
            className="
              flex items-center gap-2 text-sm font-semibold text-zinc-900
            "
          >
            <BookOpenCheck className="size-4" aria-hidden />
            필터 및 네비게이션
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
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,

  tone = 'default',
}: {
  label: string;
  value: string;

  tone?: 'default' | 'wrong';
}) {
  return (
    <div className="flex flex-col rounded-md border bg-card px-3 py-2.5">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span
        className={cn(
          'mt-1 text-xl/tight font-bold text-zinc-950',
          tone === 'wrong' && 'text-destructive',
        )}
      >
        {value}
      </span>
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
        <span className="text-xs font-medium text-zinc-500">내 답안</span>
        <span className="mt-1 rounded-md bg-zinc-50 px-3 py-2 text-zinc-900">
          {formatUserAnswer(question, answer)}
        </span>
      </div>
      <div>
        <span className="text-xs font-medium text-zinc-500">정답</span>
        <span
          className="
            mt-1 rounded-md bg-emerald-50 px-3 py-2 font-medium text-emerald-800
          "
        >
          {formatCorrectAnswer(question.result)}
        </span>
      </div>
    </div>
  );
}

function QuestionResultPanel({ result }: { result: QuestionResult }) {
  return (
    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
      <span className="font-semibold text-blue-900">해설</span>
      <span className="mt-2 whitespace-pre-wrap text-blue-800">
        {result.explanation || '등록된 해설이 없습니다.'}
      </span>
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
