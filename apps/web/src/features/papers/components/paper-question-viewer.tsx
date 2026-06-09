'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kichulbot/ui/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Eye, List, Play } from 'lucide-react';
import Link from 'next/link';
import { overlay } from 'overlay-kit';
import { useEffect, useState } from 'react';

import { QuestionActions } from '@/features/learning/components/question-actions';
import { formatDuration } from '@/features/learning/lib/format';
import type { Paper, PaperQuestion } from '@/features/papers/types';
import { SectionTitle } from '@/shared/components/section-title';
import { cn } from '@/shared/lib/utils';

export function PaperQuestionViewer({
  paper,
  questions,
  initialQuestionNumber,
  isAuthenticated,
}: {
  paper: Paper;
  questions: PaperQuestion[];
  initialQuestionNumber: number;
  isAuthenticated: boolean;
}) {
  const initialIndex = Math.max(
    questions.findIndex(
      (question) => question.number === initialQuestionNumber,
    ),
    0,
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [revealedAnswerIds, setRevealedAnswerIds] = useState<Set<string>>(
    () => new Set(),
  );
  const question = questions[currentIndex];

  const moveTo = (index: number) => {
    const nextQuestion = questions[index];
    if (!nextQuestion) return;

    setCurrentIndex(index);
    window.history.replaceState(
      null,
      '',
      getQuestionShareHref(paper.id, nextQuestion.number),
    );
  };

  const revealAnswer = () => {
    if (!question) return;
    setRevealedAnswerIds((current) => new Set(current).add(question.id));
  };

  if (!question) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        등록된 문항이 없습니다.
      </div>
    );
  }

  const canMovePrevious = currentIndex > 0;
  const canMoveNext = currentIndex < questions.length - 1;
  const shareHref = getQuestionShareHref(paper.id, question.number);
  const isAnswerRevealed = revealedAnswerIds.has(question.id);

  return (
    <div
      className="
        mx-auto flex size-full max-w-7xl flex-col gap-3 overflow-hidden
      "
    >
      <header
        className="
          grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2
          rounded-lg bg-card px-1
          md:flex md:h-16 md:justify-between md:gap-4 md:px-6
        "
      >
        <div className="hidden min-w-0 md:block">
          <div className="truncate text-xs text-muted-foreground">
            {paper.exam.name}
          </div>
          <h1 className="truncate text-base font-semibold text-foreground">
            {paper.title}
          </h1>
        </div>

        <div className="col-start-1 flex justify-start md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 px-0"
            disabled={!canMovePrevious}
            onClick={() => moveTo(currentIndex - 1)}
          >
            <ChevronLeft />
            <span className="sr-only">이전 문항</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-9 px-0"
            disabled={!canMoveNext}
            onClick={() => moveTo(currentIndex + 1)}
          >
            <ChevronRight />
            <span className="sr-only">다음 문항</span>
          </Button>
        </div>

        <span
          className="
            col-start-2 text-sm font-semibold text-muted-foreground tabular-nums
            md:hidden
          "
        >
          {currentIndex + 1} / {questions.length}
        </span>

        <div className="col-start-3 flex justify-end gap-1 md:hidden">
          <QuestionListDropdown
            questions={questions}
            currentIndex={currentIndex}
            onMoveTo={moveTo}
            compact
          />
          <MobileAnswerDialog question={question} onRevealAnswer={revealAnswer}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-9 px-0"
            >
              <Eye />
              <span className="sr-only">정답 확인</span>
            </Button>
          </MobileAnswerDialog>
          <QuestionActions
            questionId={question.id}
            questionRevisionId={question.questionRevisionId}
            shareHref={shareHref}
            isAuthenticated={isAuthenticated}
            compact
          />
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href={`/resources/${paper.id}`}>
              <Play />
              바로 풀기
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canMovePrevious}
            onClick={() => moveTo(currentIndex - 1)}
          >
            <ChevronLeft data-icon="inline-start" />
            이전
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canMoveNext}
            onClick={() => moveTo(currentIndex + 1)}
          >
            다음
            <ChevronRight data-icon="inline-end" />
          </Button>
          <QuestionListDropdown
            questions={questions}
            currentIndex={currentIndex}
            onMoveTo={moveTo}
          />
        </div>
      </header>

      <div
        className="
          grid min-h-0 flex-1 gap-3 overflow-hidden
          md:grid-cols-[minmax(0,1fr)_320px] md:gap-4
        "
      >
        <section
          className="
            flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card
          "
        >
          <div
            className="
              hidden shrink-0 items-center justify-between gap-4 border-b px-4
              py-3
              md:flex
            "
          >
            <QuestionMeta question={question} />
            <div className="flex items-center gap-3">
              <QuestionActions
                questionId={question.id}
                questionRevisionId={question.questionRevisionId}
                shareHref={shareHref}
                isAuthenticated={isAuthenticated}
              />
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt={`${question.number}번 문제`}
              className="size-full rounded-md object-contain"
            />
          </div>
        </section>

        <aside
          className="
            hidden min-h-0 flex-col gap-4 overflow-hidden rounded-lg border
            bg-card p-4
            md:flex
          "
        >
          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle className="text-sm">정답 확인</SectionTitle>
              {!isAnswerRevealed && (
                <Button type="button" size="sm" onClick={revealAnswer}>
                  <Eye data-icon="inline-start" />
                  정답 확인
                </Button>
              )}
            </div>
            {isAnswerRevealed ? (
              <AnswerPanel question={question} />
            ) : (
              <div
                className="
                  grid min-h-28 place-items-center rounded-lg border bg-secondary
                  px-4 text-center text-sm text-muted-foreground
                "
              >
                정답 확인 버튼을 누르면 정답과 해설을 볼 수 있습니다.
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function QuestionMeta({ question }: { question: PaperQuestion }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <SectionTitle>{question.number}번</SectionTitle>
        <span
          className="
            rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground
          "
        >
          {question.points}점
        </span>
      </div>
      {question.recommendedTimeSeconds && (
        <p className="mt-1 text-xs text-muted-foreground">
          권장 풀이시간 {formatDuration(question.recommendedTimeSeconds * 1000)}
        </p>
      )}
    </div>
  );
}

function MobileAnswerDialog({
  question,
  onRevealAnswer,
  children,
}: {
  question: PaperQuestion;
  onRevealAnswer: () => void;
  children: React.ReactNode;
}) {
  const openAnswer = async () => {
    onRevealAnswer();
    await overlay.openAsync<void>(({ isOpen, close, unmount }) => (
      <MobileAnswerOverlayDialog
        isOpen={isOpen}
        question={question}
        onClose={close}
        onExit={unmount}
      />
    ));
  };

  return <span onClick={() => void openAnswer()}>{children}</span>;
}

function MobileAnswerOverlayDialog({
  isOpen,
  question,
  onClose,
  onExit,
}: {
  isOpen: boolean;
  question: PaperQuestion;
  onClose: () => void;
  onExit: () => void;
}) {
  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{question.number}번 정답</DialogTitle>
        </DialogHeader>
        <AnswerPanel question={question} />
      </DialogContent>
    </Dialog>
  );
}

function AnswerPanel({ question }: { question: PaperQuestion }) {
  return (
    <div className="grid gap-3">
      <div className="rounded-lg border bg-card p-4">
        <span className="text-xs text-muted-foreground">정답</span>
        <div className="mt-2 text-xl/tight font-bold text-foreground">
          {formatCorrectAnswer(question)}
        </div>
      </div>
      <div className="min-h-24 rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
        {question.explanation || '등록된 해설이 없습니다.'}
      </div>
    </div>
  );
}

function QuestionListDropdown({
  questions,
  currentIndex,
  onMoveTo,
  compact = false,
}: {
  questions: PaperQuestion[];
  currentIndex: number;
  onMoveTo: (index: number) => void;
  compact?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={compact ? 'ghost' : 'outline'}
          size={compact ? 'sm' : 'icon-sm'}
          className={cn(compact && 'size-9 px-0')}
        >
          <List />
          <span className={cn(compact && 'sr-only')}>문항</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56">
        {questions.map((question, index) => (
          <DropdownMenuItem
            key={question.id}
            className={cn(
              'justify-between',
              currentIndex === index && 'bg-accent text-accent-foreground',
            )}
            onSelect={() => onMoveTo(index)}
          >
            <span>{question.number}번</span>
            <span className="text-xs text-muted-foreground">
              {currentIndex === index ? '현재' : ''}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatCorrectAnswer(question: PaperQuestion) {
  if (question.type === 'MULTIPLE_CHOICE') {
    if (question.gradingPolicy === 'ANY_CHOICE') return '모든 선택지';
    return question.answerChoice
      ? `${question.answerChoice}번`
      : '등록된 정답 없음';
  }
  return question.answerText || '등록된 정답 없음';
}

function getQuestionShareHref(paperId: string, questionNumber: number) {
  return `/resources/${paperId}/questions?question=${questionNumber}`;
}
