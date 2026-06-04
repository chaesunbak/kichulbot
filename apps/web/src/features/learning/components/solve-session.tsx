'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kichulbot/ui/components/ui/dropdown-menu';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Textarea } from '@kichulbot/ui/components/ui/textarea';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  LogOut,
  Send,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  saveSolveSessionAnswer,
  submitSolveSession,
} from '@/features/learning/api/client';
import { QuestionActions } from '@/features/learning/components/question-actions';
import {
  formatClock,
  formatDuration,
  formatSolveMode,
} from '@/features/learning/lib/format';
import {
  saveLocalSolveSessionAnswer,
  submitLocalSolveSession,
} from '@/features/learning/lib/local-solve-session';
import type {
  Answer,
  SolveQuestion,
  SolveSession,
} from '@/features/learning/types';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { SectionTitle } from '@/shared/components/section-title';
import { cn } from '@/shared/lib/utils';

type SaveAnswerPayload = {
  answerChoice?: number;
  answerText?: string;
};

export function SolveSession({
  initialSession,
}: {
  initialSession: SolveSession;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [activeElapsed, setActiveElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const elapsedMilliseconds = useRef(0);
  const question = session.paper.questions[currentIndex];
  const answer = session.answers.find(
    (answer) => answer.questionId === question?.id,
  );
  const isLocalSession = session.id.startsWith('local_');

  const answeredIds = useMemo(
    () =>
      new Set(
        session.answers
          .filter(
            (answer) =>
              answer.answerChoice !== null || answer.answerText !== null,
          )
          .map((answer) => answer.questionId),
      ),
    [session.answers],
  );
  const effectiveAnsweredIds = useMemo(() => {
    const ids = new Set(answeredIds);
    if (question?.type === 'WRITTEN' && answerText.trim()) {
      ids.add(question.id);
    }
    return ids;
  }, [answeredIds, answerText, question]);
  const unansweredCount =
    session.paper.questions.length - effectiveAnsweredIds.size;
  const totalElapsedMilliseconds = useMemo(
    () =>
      session.answers.reduce(
        (total, answer) => total + answer.spentMilliseconds,
        0,
      ) + activeElapsed,
    [activeElapsed, session.answers],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
      if (!session.submittedAt) {
        elapsedMilliseconds.current += 1000;
        setActiveElapsed((current) => current + 1000);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session.submittedAt]);

  const saveProgress = async (
    questionId: string,
    payload: {
      answerChoice?: number;
      answerText?: string;
      spentMilliseconds?: number;
    },
  ) => {
    const body = isLocalSession
      ? saveLocalSolveSessionAnswer({
          sessionId: session.id,
          questionId,
          payload,
        })
      : await saveSolveSessionAnswer({
          sessionId: session.id,
          questionId,
          payload,
        });
    setSession((current) => ({
      ...current,
      paper: {
        ...current.paper,
        questions: current.paper.questions.map((item) =>
          item.id === questionId && body.result
            ? { ...item, result: body.result }
            : item,
        ),
      },
      answers: [
        ...current.answers.filter((answer) => answer.questionId !== questionId),
        body.answer,
      ],
    }));
  };

  const takeElapsed = () => {
    const elapsed = elapsedMilliseconds.current;
    elapsedMilliseconds.current = 0;
    setActiveElapsed(0);
    return elapsed;
  };

  const getCurrentAnswerPayload = (): SaveAnswerPayload => {
    if (question?.type !== 'WRITTEN') return {};
    const trimmedAnswerText = answerText.trim();
    if (!trimmedAnswerText || trimmedAnswerText === answer?.answerText) {
      return {};
    }
    return { answerText: trimmedAnswerText };
  };

  const saveCurrentProgress = async () => {
    if (!question || session.submittedAt) return;
    await saveProgress(question.id, {
      ...getCurrentAnswerPayload(),
      spentMilliseconds: takeElapsed(),
    });
  };

  const showFailureMessage = (message: string) => {
    setMessage(message);
    toast.error(message);
  };

  const saveAnswer = async (payload: SaveAnswerPayload) => {
    if (!question || session.submittedAt) return;
    setMessage('저장 중...');
    try {
      await saveProgress(question.id, {
        ...payload,
        spentMilliseconds: takeElapsed(),
      });
      setMessage('저장했습니다.');
    } catch {
      showFailureMessage('답안을 저장하지 못했습니다.');
    }
  };

  const moveTo = async (index: number) => {
    if (!question || index === currentIndex) return;
    if (!session.submittedAt) {
      try {
        await saveProgress(question.id, { spentMilliseconds: takeElapsed() });
      } catch {
        showFailureMessage('풀이 시간을 저장하지 못했습니다.');
      }
    }
    setCurrentIndex(index);
    setAnswerText('');
    setMessage(null);
    elapsedMilliseconds.current = 0;
  };

  const leave = async () => {
    if (!question || session.submittedAt || isFinishing) return;
    setIsFinishing(true);
    setMessage('풀이를 저장하는 중...');
    try {
      await saveCurrentProgress();
      setMessage('저장했습니다.');
      router.push(isLocalSession ? `/resources/${session.paper.id}` : '/log');
    } catch {
      setIsFinishing(false);
      showFailureMessage('풀이를 저장하지 못했습니다.');
    }
  };

  const requestSubmit = () => {
    if (unansweredCount > 0) {
      setIsSubmitConfirmOpen(true);
      return;
    }
    void submit();
  };

  const submit = async () => {
    if (!question || session.submittedAt || isFinishing) return;
    setIsSubmitConfirmOpen(false);
    setIsFinishing(true);
    setMessage('제출하는 중...');
    try {
      await saveCurrentProgress();
      if (isLocalSession) {
        submitLocalSolveSession(session.id);
      } else {
        await submitSolveSession(session.id);
      }
      setMessage('결과 페이지로 이동 중입니다.');
      router.replace(
        isLocalSession
          ? `/results/local/${session.id}`
          : `/results/${session.id}`,
      );
    } catch {
      setIsFinishing(false);
      showFailureMessage('풀이를 제출하지 못했습니다.');
    }
  };

  if (!question) {
    return (
      <div className="grid h-full place-items-center text-sm text-zinc-500">
        등록된 문항이 없습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto flex size-full max-w-7xl flex-col overflow-hidden">
      <SolveSessionHeader
        title={session.paper.title}
        mode={session.mode}
        currentTime={currentTime}
        elapsedMilliseconds={totalElapsedMilliseconds}
        submitted={!!session.submittedAt}
        isFinishing={isFinishing}
        allAnswered={unansweredCount === 0}
        onLeave={leave}
        onSubmit={requestSubmit}
      />

      <div
        className="
          grid min-h-0 w-full flex-1 gap-3 overflow-hidden p-3
          md:grid-cols-[minmax(0,1fr)_320px] md:gap-4 md:p-4
        "
      >
        <QuestionPanel
          question={question}
          currentIndex={currentIndex}
          questionCount={session.paper.questions.length}
          isAuthenticated={!isLocalSession}
        />

        <SolveControlPanel
          session={session}
          question={question}
          answer={answer}
          answerText={answerText}
          currentIndex={currentIndex}
          answeredIds={answeredIds}
          disabled={!!session.submittedAt}
          message={message}
          onAnswerTextChange={setAnswerText}
          onSaveAnswer={saveAnswer}
          onMoveTo={moveTo}
        />
      </div>
      <ConfirmDialog
        isOpen={isSubmitConfirmOpen}
        title="아직 풀지 않은 문제가 있습니다"
        description={`미답 문항 ${unansweredCount}개가 오답으로 처리됩니다.`}
        cancelLabel="계속 풀기"
        confirmLabel="제출하기"
        onCancel={() => setIsSubmitConfirmOpen(false)}
        onConfirm={() => void submit()}
        onExit={() => undefined}
      />
    </div>
  );
}

function SolveSessionHeader({
  title,
  mode,
  currentTime,
  elapsedMilliseconds,
  submitted,
  isFinishing,
  allAnswered,
  onLeave,
  onSubmit,
}: {
  title: string;
  mode: SolveSession['mode'];
  currentTime: Date;
  elapsedMilliseconds: number;
  submitted: boolean;
  isFinishing: boolean;
  allAnswered: boolean;
  onLeave: () => void;
  onSubmit: () => void;
}) {
  const isExamMode = mode === 'EXAM';
  const practiceActionLabel = allAnswered ? '결과 보기' : '나가기';
  const actionIcon = allAnswered ? (
    <Send data-icon="inline-start" />
  ) : (
    <LogOut data-icon="inline-start" />
  );
  const handlePracticeAction = allAnswered ? onSubmit : onLeave;

  return (
    <header
      className="
        flex h-16 shrink-0 items-center justify-between gap-4 rounded-lg bg-card
        px-4
        md:px-6
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <h1
            className="
              mt-0.5 truncate text-base font-semibold text-zinc-950
              md:text-lg
            "
          >
            {title}
          </h1>
        </div>
      </div>
      <div
        className="
          flex shrink-0 items-center gap-2
          md:gap-3
        "
      >
        <div
          className="
            flex items-center gap-1.5 rounded-lg border p-2 text-sm
            text-zinc-600
            md:gap-2 md:px-3
          "
        >
          {formatSolveMode(mode)}
        </div>
        <div
          className="
            flex items-center gap-1.5 rounded-lg border p-2 text-sm
            text-zinc-600
            md:gap-2 md:px-3
          "
        >
          <Clock className="size-4" aria-hidden />
          <span>{formatClock(currentTime)}</span>
        </div>
        <div
          className="
            rounded-lg border px-3 py-2 text-sm text-zinc-600 tabular-nums
          "
        >
          {formatDuration(elapsedMilliseconds)}
        </div>
        {submitted ? (
          <span
            className="
              hidden rounded-lg border px-3 py-2 text-sm text-zinc-500
              sm:inline-flex
            "
          >
            종료 완료
          </span>
        ) : isExamMode ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isFinishing}
              onClick={onLeave}
            >
              <LogOut data-icon="inline-start" />
              나가기
            </Button>
            <Button type="button" disabled={isFinishing} onClick={onSubmit}>
              <Send data-icon="inline-start" />
              {isFinishing ? '처리 중...' : '제출하기'}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant={allAnswered ? 'default' : 'outline'}
            disabled={isFinishing}
            onClick={handlePracticeAction}
          >
            {actionIcon}
            {isFinishing ? '처리 중...' : practiceActionLabel}
          </Button>
        )}
      </div>
    </header>
  );
}

function QuestionPanel({
  question,
  currentIndex,
  questionCount,
  isAuthenticated,
}: {
  question: SolveQuestion;
  currentIndex: number;
  questionCount: number;
  isAuthenticated: boolean;
}) {
  return (
    <section
      className="
        flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card
      "
    >
      <QuestionHeader
        question={question}
        currentIndex={currentIndex}
        questionCount={questionCount}
        isAuthenticated={isAuthenticated}
      />
      <QuestionImage question={question} />
    </section>
  );
}

function QuestionHeader({
  question,
  currentIndex,
  questionCount,
  isAuthenticated,
}: {
  question: SolveQuestion;
  currentIndex: number;
  questionCount: number;
  isAuthenticated: boolean;
}) {
  return (
    <div
      className="
        flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3
      "
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SectionTitle>{question.number}번</SectionTitle>
          <span
            className="
              rounded-full border px-2 py-0.5 text-xs font-medium text-zinc-500
            "
          >
            {question.points}점
          </span>
        </div>
        {question.recommendedTimeSeconds && (
          <p className="mt-1 text-xs text-zinc-500">
            권장 풀이시간{' '}
            {formatDuration(question.recommendedTimeSeconds * 1000)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <QuestionActions
          questionId={question.id}
          questionRevisionId={question.questionRevisionId}
          isAuthenticated={isAuthenticated}
        />
        <span className="text-sm text-zinc-500">
          {currentIndex + 1} / {questionCount}
        </span>
      </div>
    </div>
  );
}

function QuestionImage({ question }: { question: SolveQuestion }) {
  return (
    <div className="min-h-0 flex-1 p-3">
      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt={`${question.number}번 문제`}
          className="size-full rounded-md object-contain"
        />
      ) : (
        <div
          className="
            grid h-full place-items-center rounded-md bg-card px-4 text-center
            text-sm text-zinc-500
          "
        >
          문제 이미지가 없습니다.
        </div>
      )}
    </div>
  );
}

function AnswerSection({
  question,
  answer,
  answerText,
  disabled,
  message,
  onAnswerTextChange,
  onSaveAnswer,
}: {
  question: SolveQuestion;
  answer?: Answer;
  answerText: string;
  disabled: boolean;
  message: string | null;
  onAnswerTextChange: (value: string) => void;
  onSaveAnswer: (payload: SaveAnswerPayload) => void;
}) {
  void message;

  return (
    <section className="grid gap-3">
      <div>
        <SectionTitle className="text-sm">답안 입력</SectionTitle>
      </div>
      {question.type === 'MULTIPLE_CHOICE' ? (
        <ChoiceAnswerInput
          choiceCount={question.choiceCount ?? 0}
          selectedChoice={answer?.answerChoice}
          disabled={disabled}
          onSelect={(answerChoice) => onSaveAnswer({ answerChoice })}
        />
      ) : (
        <WrittenAnswerInput
          answerText={answerText}
          savedAnswerText={answer?.answerText}
          disabled={disabled}
          onAnswerTextChange={onAnswerTextChange}
          onSave={(value) => onSaveAnswer({ answerText: value })}
        />
      )}

      <AnswerMeta answer={answer} />
    </section>
  );
}

function ChoiceAnswerInput({
  choiceCount,
  selectedChoice,
  disabled,
  onSelect,
}: {
  choiceCount: number;
  selectedChoice?: number | null;
  disabled: boolean;
  onSelect: (choice: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: choiceCount }, (_, index) => {
        const choice = index + 1;
        return (
          <Button
            key={choice}
            type="button"
            variant="outline"
            className={cn(
              'aspect-square w-10 rounded-full p-0',
              selectedChoice === choice &&
                `
                  bg-zinc-500 text-zinc-100
                  hover:bg-zinc-400 hover:text-zinc-100
                `,
            )}
            disabled={disabled}
            onClick={() => onSelect(choice)}
          >
            {choice}
          </Button>
        );
      })}
    </div>
  );
}

function WrittenAnswerInput({
  answerText,
  savedAnswerText,
  disabled,
  onAnswerTextChange,
  onSave,
}: {
  answerText: string;
  savedAnswerText?: string | null;
  disabled: boolean;
  onAnswerTextChange: (value: string) => void;
  onSave: (value: string) => void;
}) {
  const value = answerText || savedAnswerText || '';

  return (
    <div className="grid gap-2">
      <Textarea
        className="min-h-20"
        value={value}
        disabled={disabled}
        placeholder="답안을 입력해주세요."
        onChange={(event) => onAnswerTextChange(event.target.value)}
      />
      <Button
        type="button"
        className="justify-self-end"
        disabled={disabled}
        onClick={() => onSave(value)}
      >
        임시 저장
      </Button>
    </div>
  );
}

function AnswerMeta({ answer }: { answer?: Answer }) {
  return (
    <div
      className="
        mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500
      "
    >
      {answer && (
        <span>누적 풀이시간 {formatDuration(answer.spentMilliseconds)}</span>
      )}
    </div>
  );
}

function SolveControlPanel({
  session,
  question,
  answer,
  answerText,
  currentIndex,
  answeredIds,
  disabled,
  message,
  onAnswerTextChange,
  onSaveAnswer,
  onMoveTo,
}: {
  session: SolveSession;
  question: SolveQuestion;
  answer?: Answer;
  answerText: string;
  currentIndex: number;
  answeredIds: Set<string>;
  disabled: boolean;
  message: string | null;
  onAnswerTextChange: (value: string) => void;
  onSaveAnswer: (payload: SaveAnswerPayload) => void;
  onMoveTo: (index: number) => void;
}) {
  return (
    <aside
      className="
        flex min-h-0 flex-col gap-5 overflow-hidden rounded-lg border bg-card
        p-4
      "
    >
      <QuestionNavigationControls
        questions={session.paper.questions}
        currentIndex={currentIndex}
        answeredIds={answeredIds}
        onMoveTo={onMoveTo}
      />
      <AnswerSection
        question={question}
        answer={answer}
        answerText={answerText}
        disabled={disabled}
        message={message}
        onAnswerTextChange={onAnswerTextChange}
        onSaveAnswer={onSaveAnswer}
      />
      {session.mode === 'ONE_BY_ONE' && (
        <ResultCheckPanel question={question} answer={answer} />
      )}
    </aside>
  );
}

function QuestionNavigationControls({
  questions,
  currentIndex,
  answeredIds,
  onMoveTo,
}: {
  questions: SolveQuestion[];
  currentIndex: number;
  answeredIds: Set<string>;
  onMoveTo: (index: number) => void;
}) {
  const canMovePrevious = currentIndex > 0;
  const canMoveNext = currentIndex < questions.length - 1;

  return (
    <section className="grid gap-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canMovePrevious}
          onClick={() => onMoveTo(currentIndex - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
          이전
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canMoveNext}
          onClick={() => onMoveTo(currentIndex + 1)}
        >
          다음
          <ChevronRight data-icon="inline-end" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon-sm">
              <List />
              <span className="sr-only">문항 목록</span>
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
                  {currentIndex === index
                    ? '현재'
                    : answeredIds.has(question.id)
                      ? '응답'
                      : ''}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}

function ResultCheckPanel({
  question,
  answer,
}: {
  question: SolveQuestion;
  answer?: Answer;
}) {
  const hasSubmittedAnswer =
    !!answer && (answer.answerChoice !== null || !!answer.answerText);
  const result = question.result;

  if (!hasSubmittedAnswer) return null;

  return (
    <section className="border-t pt-4">
      <span className="text-sm font-semibold">채점 확인</span>
      <div
        className={cn(
          'mt-3 rounded-lg border p-3 text-sm',
          result?.isCorrect === true &&
            'border-emerald-200 bg-emerald-50 text-emerald-800',
          result?.isCorrect === false &&
            'border-red-200 bg-red-50 text-red-800',
          result?.isCorrect == null && 'bg-zinc-50 text-zinc-600',
        )}
      >
        <div className="flex items-center gap-2 font-semibold">
          {result?.isCorrect === true && (
            <>
              <CheckCircle2 className="size-4" aria-hidden />
              정답
            </>
          )}
          {result?.isCorrect === false && (
            <>
              <XCircle className="size-4" aria-hidden />
              오답
            </>
          )}
          {result?.isCorrect == null && '확인 대기'}
        </div>
        {result && (
          <p className="mt-2 text-xs">
            정답 {formatCorrectAnswer(question.result)}
          </p>
        )}
      </div>
    </section>
  );
}

function formatCorrectAnswer(result: SolveQuestion['result']) {
  if (!result) return '확인 전';
  return result.answerChoice
    ? `${result.answerChoice}번`
    : (result.answerText ?? '등록된 정답 없음');
}
