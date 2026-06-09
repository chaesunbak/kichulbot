'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@kichulbot/ui/components/ui/popover';
import { ArrowRight, Bookmark, List, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QuestionActions } from '@/features/learning/components/question-actions';
import { ResultSummarySection } from '@/features/learning/components/result-summary-section';
import { formatDate, formatDuration } from '@/features/learning/lib/format';
import type {
  Answer,
  QuestionResult,
  SolveQuestion,
  SolveSession,
} from '@/features/learning/types';
import { SectionTitle } from '@/shared/components/section-title';
import { cn } from '@/shared/lib/utils';

type ResultFilter = 'ALL' | 'WRONG' | 'CORRECT' | 'OMITTED' | 'BOOKMARK';

const filterLabels: Record<ResultFilter, string> = {
  ALL: '전체',
  WRONG: '오답',
  CORRECT: '정답',
  OMITTED: '미응답',
  BOOKMARK: '북마크',
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
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const answerByQuestionId = useMemo(
    () => new Map(session.answers.map((answer) => [answer.questionId, answer])),
    [session.answers],
  );
  const questions = session.paper.questions;
  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) =>
        matchesFilter(question, answerByQuestionId.get(question.id), filter),
      ),
    [answerByQuestionId, filter, questions],
  );
  const omittedCount = session.result
    ? session.result.totalCount - session.result.answeredCount
    : 0;
  const accuracyRate = session.result
    ? Math.round(
        (session.result.correctCount / Math.max(session.result.totalCount, 1)) *
          100,
      )
    : 0;

  const selectFilter = (nextFilter: ResultFilter) => {
    setFilter(nextFilter);
    const firstQuestion = questions.find((question) =>
      matchesFilter(question, answerByQuestionId.get(question.id), nextFilter),
    );
    if (firstQuestion) {
      setCurrentId(firstQuestion.id);
      scrollQuestionIntoView(firstQuestion.id);
    }
  };

  const scrollToQuestion = (questionId: string) => {
    setCurrentId(questionId);
    setIsNavigatorOpen(false);
    scrollQuestionIntoView(questionId);
  };

  if (!questions.length || !session.result) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-muted-foreground">확인할 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div
      className="
        mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8
        sm:py-10
      "
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {session.paper.title}
          </h1>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>
              {formatDate(session.submittedAt ?? session.updatedAt)} 제출
            </span>
            <span>
              {session.mode === 'ONE_BY_ONE' ? '연습모드' : '시험모드'}
            </span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/resources/${session.paper.id}`}>
            <RotateCcw />
            다시 풀기
          </Link>
        </Button>
      </div>

      <ResultSummarySection
        score={session.result.score}
        accuracyRate={accuracyRate}
        correctCount={session.result.correctCount}
        totalCount={session.result.totalCount}
        wrongCount={session.result.wrongCount}
        omittedCount={omittedCount}
        spentTime={formatDuration(session.result.totalSpentMilliseconds)}
      />

      <div className="lg:hidden">
        <ResultFilterTabs filter={filter} onSelectFilter={selectFilter} />
      </div>

      <div
        className="
          grid gap-4
          lg:grid-cols-[minmax(0,1fr)_300px]
        "
      >
        <div className="flex flex-col gap-4">
          {filteredQuestions.map((question) => (
            <ResultQuestionCard
              key={question.id}
              question={question}
              answer={answerByQuestionId.get(question.id)}
              showPersonalActions={showPersonalActions}
              isAuthenticated={isAuthenticated}
            />
          ))}
          {filteredQuestions.length === 0 && (
            <section className="rounded-lg border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                이 조건에 해당하는 문항이 없습니다.
              </p>
            </section>
          )}
        </div>

        <ResultNavigatorAside
          filteredQuestions={filteredQuestions}
          answerByQuestionId={answerByQuestionId}
          currentId={currentId}
          filter={filter}
          onSelectFilter={selectFilter}
          onSelectQuestion={scrollToQuestion}
        />
      </div>

      <MobileResultNavigator
        open={isNavigatorOpen}
        onOpenChange={setIsNavigatorOpen}
        questions={questions}
        filteredQuestions={filteredQuestions}
        answerByQuestionId={answerByQuestionId}
        currentId={currentId}
        filter={filter}
        onSelectFilter={selectFilter}
        onSelectQuestion={scrollToQuestion}
      />
    </div>
  );
}

function ResultNavigatorAside({
  filteredQuestions,
  answerByQuestionId,
  currentId,
  filter,
  onSelectFilter,
  onSelectQuestion,
}: {
  filteredQuestions: SolveQuestion[];
  answerByQuestionId: Map<string, Answer>;
  currentId?: string;
  filter: ResultFilter;
  onSelectFilter: (filter: ResultFilter) => void;
  onSelectQuestion: (questionId: string) => void;
}) {
  return (
    <aside
      className="
        hidden h-fit rounded-lg border bg-card p-4
        lg:sticky lg:top-24 lg:block
      "
    >
      <div className="flex items-center text-sm font-semibold text-foreground">
        문항목록
      </div>

      <div className="mt-4">
        <ResultFilterTabs filter={filter} onSelectFilter={onSelectFilter} />
      </div>

      <div className="mt-4">
        <ResultQuestionNavigator
          questions={filteredQuestions}
          answerByQuestionId={answerByQuestionId}
          currentId={currentId}
          onSelectQuestion={onSelectQuestion}
        />
      </div>

      {filteredQuestions.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          이 조건에 해당하는 문항이 없습니다.
        </p>
      )}
    </aside>
  );
}

function MobileResultNavigator({
  open,
  onOpenChange,
  questions,
  filteredQuestions,
  answerByQuestionId,
  currentId,
  filter,
  onSelectFilter,
  onSelectQuestion,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: SolveQuestion[];
  filteredQuestions: SolveQuestion[];
  answerByQuestionId: Map<string, Answer>;
  currentId?: string;
  filter: ResultFilter;
  onSelectFilter: (filter: ResultFilter) => void;
  onSelectQuestion: (questionId: string) => void;
}) {
  const currentQuestionNumber =
    questions.find((question) => question.id === currentId)?.number ??
    questions[0]?.number ??
    0;

  return (
    <div
      className="
        fixed right-4 bottom-20 z-40
        lg:hidden
      "
    >
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon-lg"
            className="
            rounded-lg px-3
            "
            aria-label="문항 네비게이션 열기"
          >
            <List className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          className="
            max-h-[calc(100vh-9rem)] w-[calc(100vw-2rem)] max-w-88 gap-3
            overflow-y-auto rounded-3xl p-4
          "
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold text-foreground">
              문항 {currentQuestionNumber}/{questions.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="문항 네비게이션 닫기"
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
          </div>

          <ResultFilterTabs
            filter={filter}
            onSelectFilter={onSelectFilter}
            compact
          />

          <ResultQuestionNavigator
            questions={filteredQuestions}
            answerByQuestionId={answerByQuestionId}
            currentId={currentId}
            onSelectQuestion={onSelectQuestion}
            compact
          />

          {filteredQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              이 조건에 해당하는 문항이 없습니다.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ResultFilterTabs({
  filter,
  onSelectFilter,
  compact = false,
}: {
  filter: ResultFilter;
  onSelectFilter: (filter: ResultFilter) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-lg border bg-card">
      {(Object.keys(filterLabels) as ResultFilter[]).map((item) => (
        <Button
          key={item}
          type="button"
          variant={filter === item ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-9 rounded-none border-r px-2 text-sm font-semibold text-muted-foreground last:border-r-0',
            compact && 'h-8 px-1 text-xs',
            filter === item &&
              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          )}
          onClick={() => onSelectFilter(item)}
        >
          {filterLabels[item]}
        </Button>
      ))}
    </div>
  );
}

function ResultQuestionNavigator({
  questions,
  answerByQuestionId,
  currentId,
  onSelectQuestion,
  compact = false,
}: {
  questions: SolveQuestion[];
  answerByQuestionId: Map<string, Answer>;
  currentId?: string;
  onSelectQuestion: (questionId: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('grid grid-cols-5', compact ? 'gap-1.5' : 'gap-2')}>
      {questions.map((question) => {
        const answer = answerByQuestionId.get(question.id);
        const status = getQuestionStatus(question, answer);
        return (
          <Button
            key={question.id}
            type="button"
            variant={currentId === question.id ? 'default' : 'outline'}
            className={cn(
              'relative h-12 rounded-lg bg-card text-base font-semibold text-muted-foreground',
              compact && 'h-9 rounded-md text-sm',
              currentId === question.id &&
                'bg-primary text-primary-foreground hover:bg-primary/90',
              currentId !== question.id &&
                status === 'correct' &&
                'bg-emerald-50 text-emerald-400 hover:bg-emerald-100 hover:text-emerald-400',
              currentId !== question.id &&
                status === 'wrong' &&
                'bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-400',
              currentId !== question.id &&
                status === 'review' &&
                'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
              currentId !== question.id &&
                status === 'omitted' &&
                'bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground',
            )}
            onClick={() => onSelectQuestion(question.id)}
          >
            <span>{question.number}</span>
            {question.isBookmarked && (
              <Bookmark
                className={cn(
                  'absolute top-0.5 right-1.5 size-4 fill-primary text-primary',
                  compact && 'right-1 size-3',
                  currentId === question.id &&
                    'fill-primary-foreground text-primary-foreground',
                )}
              />
            )}
          </Button>
        );
      })}
    </div>
  );
}

function ResultQuestionCard({
  question,
  answer,
  showPersonalActions,
  isAuthenticated,
}: {
  question: SolveQuestion;
  answer?: Answer;
  showPersonalActions: boolean;
  isAuthenticated: boolean;
}) {
  return (
    <section
      id={getQuestionElementId(question.id)}
      className="scroll-mt-24 overflow-hidden rounded-lg border bg-card"
    >
      <div
        className="
          flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3
        "
      >
        <div className="flex items-center gap-2">
          <SectionTitle className="text-foreground">
            {question.number}번
          </SectionTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            풀이시간 {formatDuration(answer?.spentMilliseconds ?? 0)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuestionActions
            questionId={question.id}
            questionRevisionId={question.questionRevisionId}
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
        <div className="min-h-105 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.imageUrl}
            alt={`${question.number}번 문제`}
            className="size-full min-h-99 rounded-md object-contain"
          />
        </div>

        <div className="m-4 rounded-lg bg-secondary p-4">
          <AnswerBlock question={question} answer={answer} />
          {question.result && <QuestionResultPanel result={question.result} />}
        </div>
      </div>
    </section>
  );
}

function AnswerBlock({
  question,
  answer,
}: {
  question: SolveQuestion;
  answer?: Answer;
}) {
  const status = getQuestionStatus(question, answer);

  return (
    <div
      className="
        grid items-stretch gap-3 text-sm
        sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
      "
    >
      <AnswerCompareCard
        label="내 답안"
        value={formatUserAnswer(question, answer)}
        tone={getAnswerStatusTone(status)}
      />
      <div
        className="
          flex items-center justify-center text-muted-foreground
          sm:px-1
        "
      >
        <ArrowRight
          className="
            size-5 rotate-90
            sm:rotate-0
          "
          aria-hidden
        />
      </div>
      <AnswerCompareCard
        label="정답"
        value={formatCorrectAnswer(question.result)}
        tone="correct"
      />
    </div>
  );
}

function AnswerCompareCard({
  label,
  value,
}: {
  label: string;
  value: string;

  tone?: 'default' | 'correct' | 'wrong' | 'omitted';
}) {
  return (
    <div
      className="
        flex min-h-20 flex-col justify-center gap-2 rounded-lg border bg-card p-4
      "
    >
      <span className="text-xs text-muted-foreground">{label}</span>

      <span className="text-xl/tight font-bold text-foreground">{value}</span>
    </div>
  );
}

function getAnswerStatusTone(status: ReturnType<typeof getQuestionStatus>) {
  if (status === 'correct') return 'correct';
  if (status === 'wrong') return 'wrong';
  if (status === 'omitted') return 'omitted';
  return 'default';
}

function QuestionResultPanel({ result }: { result: QuestionResult }) {
  return (
    <div
      className="
      p-4 text-sm
    "
    >
      <span className="text-gray-600">
        {result.explanation || '등록된 해설이 없습니다.'}
      </span>
    </div>
  );
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
    (filter === 'OMITTED' && status === 'omitted') ||
    (filter === 'BOOKMARK' && question.isBookmarked)
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
  if (result.gradingPolicy === 'ANY_CHOICE') return '모든 선택지';
  return result.answerChoice
    ? `${result.answerChoice}번`
    : (result.answerText ?? '등록된 정답 없음');
}

function getQuestionElementId(questionId: string) {
  return `result-question-${questionId}`;
}

function scrollQuestionIntoView(questionId: string) {
  requestAnimationFrame(() => {
    document.getElementById(getQuestionElementId(questionId))?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
}
