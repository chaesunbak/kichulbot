'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  MoreVertical,
  Send,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import posthog from 'posthog-js';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import {
  saveSolveSessionAnswer,
  submitSolveSession,
} from '@/features/learning/api/client/mutations';
import { QuestionActions } from '@/features/learning/components/question-actions';
import { QuestionReportMenuItem } from '@/features/learning/components/question-report-button';
import {
  formatClock,
  formatDuration,
  formatSolveMode,
} from '@/features/learning/lib/format';
import {
  saveLocalSolveSessionAnswer,
  submitLocalSolveSession,
} from '@/features/learning/lib/local-solve-session';
import { getResumeQuestionIndex } from '@/features/learning/lib/solve-session-resume';
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
  const solveSessionRef = useRef<HTMLDivElement>(null);
  const firstAnswerControlRef = useRef<HTMLButtonElement | HTMLTextAreaElement>(
    null,
  );
  const [session, setSession] = useState(initialSession);
  const [currentIndex, setCurrentIndex] = useState(() =>
    getResumeQuestionIndex(initialSession),
  );
  const [answerText, setAnswerText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [elapsedResetKey, setElapsedResetKey] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [revealedAnswerIds, setRevealedAnswerIds] = useState<Set<string>>(
    () => new Set(),
  );
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
  const hasCurrentAnswer =
    !!answer?.answerChoice || !!answer?.answerText || !!answerText.trim();
  const isCurrentAnswerRevealed = question
    ? revealedAnswerIds.has(question.id)
    : false;
  const savedElapsedMilliseconds = useMemo(
    () =>
      session.answers.reduce((total, answer) => {
        return total + answer.spentMilliseconds;
      }, 0),
    [session.answers],
  );
  const getSolveEventProperties = () => ({
    session_id: session.id,
    paper_id: session.paper.id,
    mode: session.mode,
    question_count: session.paper.questions.length,
    answered_count: effectiveAnsweredIds.size,
    authenticated: !isLocalSession,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!session.submittedAt) {
        elapsedMilliseconds.current += 1000;
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session.submittedAt]);

  useEffect(() => {
    const focusFirstAnswerOnInitialTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.shiftKey || event.defaultPrevented) {
        return;
      }

      const activeElement = document.activeElement;
      const isPageEntryFocus =
        activeElement === document.body ||
        activeElement === document.documentElement ||
        activeElement === solveSessionRef.current;

      if (!isPageEntryFocus || !firstAnswerControlRef.current) return;

      event.preventDefault();
      firstAnswerControlRef.current.focus();
    };

    window.addEventListener('keydown', focusFirstAnswerOnInitialTab);
    return () => {
      window.removeEventListener('keydown', focusFirstAnswerOnInitialTab);
    };
  }, [question?.id]);

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
    setElapsedResetKey((current) => current + 1);
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
    setRevealedAnswerIds((current) => {
      const next = new Set(current);
      next.delete(question.id);
      return next;
    });
    const spentMilliseconds = takeElapsed();
    try {
      await saveProgress(question.id, {
        ...payload,
        spentMilliseconds,
      });
      posthog.capture('solve_question_answered', {
        ...getSolveEventProperties(),
        question_id: question.id,
        question_number: question.number,
        question_type: question.type,
        answer_type: payload.answerChoice ? 'choice' : 'written',
        spent_milliseconds: spentMilliseconds,
      });
      setMessage('저장했습니다.');
    } catch {
      showFailureMessage('답안을 저장하지 못했습니다.');
    }
  };

  const changeAnswerText = (value: string) => {
    if (question) {
      setRevealedAnswerIds((current) => {
        const next = new Set(current);
        next.delete(question.id);
        return next;
      });
    }
    setAnswerText(value);
  };

  const moveTo = async (index: number) => {
    if (!question || index === currentIndex) return;
    if (!session.submittedAt) {
      try {
        await saveCurrentProgress();
      } catch {
        showFailureMessage('풀이를 저장하지 못했습니다.');
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
    const durationMilliseconds =
      savedElapsedMilliseconds + elapsedMilliseconds.current;
    try {
      await saveCurrentProgress();
      posthog.capture('solve_session_left', {
        ...getSolveEventProperties(),
        current_question_id: question.id,
        current_question_number: question.number,
        unanswered_count: unansweredCount,
        duration_milliseconds: durationMilliseconds,
      });
      setMessage('저장했습니다.');
      router.push(isLocalSession ? `/resources/${session.paper.id}` : '/logs');
    } catch {
      setIsFinishing(false);
      showFailureMessage('풀이를 저장하지 못했습니다.');
    }
  };

  const requestSubmit = async () => {
    if (unansweredCount > 0) {
      const shouldSubmit = await overlay.openAsync<boolean>(
        ({ isOpen, close, unmount }) => (
          <ConfirmDialog
            isOpen={isOpen}
            title="아직 풀지 않은 문제가 있습니다"
            description={`미답 문항 ${unansweredCount}개가 오답으로 처리됩니다.`}
            cancelLabel="계속 풀기"
            confirmLabel="시험종료"
            onCancel={() => close(false)}
            onConfirm={() => close(true)}
            onExit={unmount}
          />
        ),
      );
      if (!shouldSubmit) return;
    }

    void submit();
  };

  const submit = async () => {
    if (!question || session.submittedAt || isFinishing) return;
    setIsFinishing(true);
    setMessage('제출하는 중...');
    const durationMilliseconds =
      savedElapsedMilliseconds + elapsedMilliseconds.current;
    try {
      await saveCurrentProgress();
      if (isLocalSession) {
        submitLocalSolveSession(session.id);
      } else {
        await submitSolveSession(session.id);
      }
      posthog.capture('solve_session_submitted', {
        session_id: session.id,
        paper_id: session.paper.id,
        mode: session.mode,
        question_count: session.paper.questions.length,
        answered_count: effectiveAnsweredIds.size,
        unanswered_count: unansweredCount,
        duration_milliseconds: durationMilliseconds,
        authenticated: !isLocalSession,
      });
      setMessage('제출이 완료되었습니다.');
      const resultPath = isLocalSession
        ? `/results/local/${session.id}`
        : `/results/${session.id}`;
      const shouldViewResult = await overlay.openAsync<boolean>(
        ({ isOpen, close, unmount }) => (
          <ConfirmDialog
            isOpen={isOpen}
            title="제출이 완료되었습니다"
            description="채점 결과를 바로 확인할 수 있습니다."
            cancelLabel="홈으로"
            confirmLabel="확인하기"
            onCancel={() => close(false)}
            onConfirm={() => close(true)}
            onExit={unmount}
          />
        ),
      );

      router.replace(shouldViewResult ? resultPath : '/');
    } catch {
      setIsFinishing(false);
      showFailureMessage('풀이를 제출하지 못했습니다.');
    }
  };

  const revealAnswer = async () => {
    if (!question || session.submittedAt || isFinishing) return;
    setMessage('답안을 확인하는 중...');
    try {
      await saveCurrentProgress();
      setRevealedAnswerIds((current) => new Set(current).add(question.id));
      posthog.capture('solve_answer_revealed', {
        ...getSolveEventProperties(),
        question_id: question.id,
        question_number: question.number,
        question_type: question.type,
        has_answer: hasCurrentAnswer,
      });
      setMessage('답안을 확인했습니다.');
    } catch {
      showFailureMessage('답안을 확인하지 못했습니다.');
    }
  };

  const moveToNextQuestion = () => {
    if (currentIndex >= session.paper.questions.length - 1) return;
    void moveTo(currentIndex + 1);
  };

  if (!question) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        등록된 문항이 없습니다.
      </div>
    );
  }

  return (
    <div
      ref={solveSessionRef}
      className="mx-auto flex size-full max-w-7xl flex-col overflow-hidden"
    >
      <SolveSessionHeader
        paperId={session.paper.id}
        title={session.paper.title}
        mode={session.mode}
        question={question}
        questions={session.paper.questions}
        currentIndex={currentIndex}
        questionCount={session.paper.questions.length}
        answeredIds={answeredIds}
        isAuthenticated={!isLocalSession}
        savedElapsedMilliseconds={savedElapsedMilliseconds}
        activeElapsedRef={elapsedMilliseconds}
        elapsedResetKey={elapsedResetKey}
        submitted={!!session.submittedAt}
        isFinishing={isFinishing}
        onMoveTo={moveTo}
        onLeave={leave}
        onSubmit={() => void requestSubmit()}
      />

      <div
        className="
          grid min-h-0 w-full flex-1 gap-3 overflow-hidden
          md:grid-cols-[minmax(0,1fr)_320px] md:gap-4
        "
      >
        <QuestionPanel
          paperId={session.paper.id}
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
          hasCurrentAnswer={hasCurrentAnswer}
          isFinishing={isFinishing}
          isAnswerRevealed={isCurrentAnswerRevealed}
          message={message}
          onAnswerTextChange={changeAnswerText}
          onSaveAnswer={saveAnswer}
          onMoveTo={moveTo}
          onRevealAnswer={revealAnswer}
          onMoveToNextQuestion={moveToNextQuestion}
          firstAnswerControlRef={firstAnswerControlRef}
        />
      </div>
    </div>
  );
}

function SolveSessionHeader({
  paperId,
  title,
  mode,
  question,
  questions,
  currentIndex,
  questionCount,
  answeredIds,
  isAuthenticated,
  savedElapsedMilliseconds,
  activeElapsedRef,
  elapsedResetKey,
  submitted,
  isFinishing,
  onMoveTo,
  onLeave,
  onSubmit,
}: {
  paperId: string;
  title: string;
  mode: SolveSession['mode'];
  question: SolveQuestion;
  questions: SolveQuestion[];
  currentIndex: number;
  questionCount: number;
  answeredIds: Set<string>;
  isAuthenticated: boolean;
  savedElapsedMilliseconds: number;
  activeElapsedRef: RefObject<number>;
  elapsedResetKey: number;
  submitted: boolean;
  isFinishing: boolean;
  onMoveTo: (index: number) => void;
  onLeave: () => void;
  onSubmit: () => void;
}) {
  const canMovePrevious = currentIndex > 0;
  const canMoveNext = currentIndex < questionCount - 1;

  return (
    <header
      className="
        grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2
        rounded-lg bg-card
        md:flex md:h-16 md:justify-between md:gap-4 md:px-6
      "
    >
      <div className="hidden min-w-0 items-center gap-3 md:flex">
        <div className="min-w-0">
          <h1
            className="
              mt-0.5 truncate text-base font-semibold text-foreground
              md:text-lg
            "
          >
            {title}
          </h1>
        </div>
      </div>
      <div className="col-start-1 flex justify-start md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-9 px-0"
          disabled={!canMovePrevious}
          onClick={() => onMoveTo(currentIndex - 1)}
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
          onClick={() => onMoveTo(currentIndex + 1)}
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
        {currentIndex + 1} / {questionCount}
      </span>
      <div className="col-start-3 flex justify-end gap-1 md:hidden">
        <QuestionListDropdown
          questions={questions}
          currentIndex={currentIndex}
          answeredIds={answeredIds}
          onMoveTo={onMoveTo}
          compact
        />
        <QuestionActions
          questionId={question.id}
          questionRevisionId={question.questionRevisionId}
          shareHref={getQuestionShareHref(paperId, question.number)}
          isAuthenticated={isAuthenticated}
          compact
          showReportAction={false}
        />
        <SolveSessionActionDropdown
          questionId={question.id}
          questionRevisionId={question.questionRevisionId}
          isAuthenticated={isAuthenticated}
          submitted={submitted}
          isFinishing={isFinishing}
          onLeave={onLeave}
          onSubmit={onSubmit}
        />
      </div>
      <div
        className="
          hidden shrink-0 items-center gap-2
          md:flex
          md:gap-3
        "
      >
        <div
          className="
            flex items-center gap-1.5 rounded-lg border p-2 text-sm
            text-muted-foreground
            md:gap-2 md:px-3
          "
        >
          {formatSolveMode(mode)}
        </div>
        <div
          className="
            flex items-center gap-1.5 rounded-lg border p-2 text-sm
            text-muted-foreground
            md:gap-2 md:px-3
          "
        >
          <Clock className="size-4" aria-hidden />
          <ClockText />
        </div>
        <ElapsedTimeText
          activeElapsedRef={activeElapsedRef}
          elapsedResetKey={elapsedResetKey}
          savedElapsedMilliseconds={savedElapsedMilliseconds}
          submitted={submitted}
        />
        {submitted ? (
          <span
            className="
              hidden rounded-lg border px-3 py-2 text-sm text-muted-foreground
              sm:inline-flex
            "
          >
            종료 완료
          </span>
        ) : (
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
              {isFinishing ? '처리 중...' : '시험종료'}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}

function SolveSessionActionDropdown({
  questionId,
  questionRevisionId,
  isAuthenticated,
  submitted,
  isFinishing,
  onLeave,
  onSubmit,
}: {
  questionId: string;
  questionRevisionId: string;
  isAuthenticated: boolean;
  submitted: boolean;
  isFinishing: boolean;
  onLeave: () => void;
  onSubmit: () => void;
}) {
  const disabled = submitted || isFinishing;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="size-9 px-0">
          <MoreVertical />
          <span className="sr-only">풀이 메뉴</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={disabled} onSelect={onLeave}>
          <LogOut />
          나가기
        </DropdownMenuItem>
        <DropdownMenuItem disabled={disabled} onSelect={onSubmit}>
          <Send />
          시험종료
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <QuestionReportMenuItem
          questionId={questionId}
          questionRevisionId={questionRevisionId}
          isAuthenticated={isAuthenticated}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClockText() {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const updateClockText = () => {
      if (textRef.current) {
        textRef.current.textContent = formatClock(new Date());
      }
    };

    updateClockText();
    const timer = window.setInterval(() => {
      updateClockText();
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <span ref={textRef}>{formatClock(new Date())}</span>;
}

function ElapsedTimeText({
  savedElapsedMilliseconds,
  activeElapsedRef,
  elapsedResetKey,
  submitted,
}: {
  savedElapsedMilliseconds: number;
  activeElapsedRef: RefObject<number>;
  elapsedResetKey: number;
  submitted: boolean;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateElapsedText = () => {
      if (textRef.current) {
        textRef.current.textContent = formatDuration(
          savedElapsedMilliseconds + (activeElapsedRef.current ?? 0),
        );
      }
    };

    updateElapsedText();
    if (submitted) return;

    const timer = window.setInterval(() => {
      updateElapsedText();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeElapsedRef, elapsedResetKey, savedElapsedMilliseconds, submitted]);

  return (
    <div
      ref={textRef}
      className="
        rounded-lg border px-3 py-2 text-sm text-muted-foreground tabular-nums
      "
    >
      {formatDuration(savedElapsedMilliseconds)}
    </div>
  );
}

function QuestionPanel({
  paperId,
  question,
  currentIndex,
  questionCount,
  isAuthenticated,
}: {
  paperId: string;
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
        paperId={paperId}
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
  paperId,
  question,
  currentIndex,
  questionCount,
  isAuthenticated,
}: {
  paperId: string;
  question: SolveQuestion;
  currentIndex: number;
  questionCount: number;
  isAuthenticated: boolean;
}) {
  return (
    <div
      className="
        hidden shrink-0 items-center justify-between gap-4 border-b px-4 py-3
        md:flex
      "
    >
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
            권장 풀이시간{' '}
            {formatDuration(question.recommendedTimeSeconds * 1000)}
          </p>
        )}
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <QuestionActions
          questionId={question.id}
          questionRevisionId={question.questionRevisionId}
          shareHref={getQuestionShareHref(paperId, question.number)}
          isAuthenticated={isAuthenticated}
        />
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {questionCount}
        </span>
      </div>
    </div>
  );
}

function QuestionImage({ question }: { question: SolveQuestion }) {
  return (
    <div className="min-h-0 flex-1 p-1">
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
            text-sm text-muted-foreground
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
  firstAnswerControlRef,
}: {
  question: SolveQuestion;
  answer?: Answer;
  answerText: string;
  disabled: boolean;
  message: string | null;
  onAnswerTextChange: (value: string) => void;
  onSaveAnswer: (payload: SaveAnswerPayload) => void;
  firstAnswerControlRef: RefObject<
    HTMLButtonElement | HTMLTextAreaElement | null
  >;
}) {
  void message;

  return (
    <section className="grid gap-4">
      <div>
        <SectionTitle className="text-sm">
          {question.type === 'MULTIPLE_CHOICE' ? '답안 선택' : '답안 입력'}
        </SectionTitle>
      </div>
      {question.type === 'MULTIPLE_CHOICE' ? (
        <ChoiceAnswerInput
          choiceCount={question.choiceCount ?? 0}
          selectedChoice={answer?.answerChoice}
          disabled={disabled}
          onSelect={(answerChoice) => onSaveAnswer({ answerChoice })}
          firstAnswerControlRef={firstAnswerControlRef}
        />
      ) : (
        <WrittenAnswerInput
          answerText={answerText}
          savedAnswerText={answer?.answerText}
          disabled={disabled}
          onAnswerTextChange={onAnswerTextChange}
          onSave={(value) => onSaveAnswer({ answerText: value })}
          firstAnswerControlRef={firstAnswerControlRef}
        />
      )}
    </section>
  );
}

function ChoiceAnswerInput({
  choiceCount,
  selectedChoice,
  disabled,
  onSelect,
  firstAnswerControlRef,
}: {
  choiceCount: number;
  selectedChoice?: number | null;
  disabled: boolean;
  onSelect: (choice: number) => void;
  firstAnswerControlRef: RefObject<
    HTMLButtonElement | HTMLTextAreaElement | null
  >;
}) {
  const optionCount = Math.max(choiceCount || 5, selectedChoice ?? 0);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (currentIndex: number, nextIndex: number) => {
    optionRefs.current[nextIndex]?.focus();
  };

  const handleChoiceKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(index, Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(index, Math.min(index + 1, optionCount - 1));
    }
  };

  return (
    <div
      style={
        {
          '--choice-count': optionCount,
        } as React.CSSProperties
      }
      className="
        grid grid-cols-[repeat(var(--choice-count),minmax(0,1fr))]
        gap-2
        md:grid-cols-1
      "
    >
      {Array.from({ length: optionCount }, (_, index) => {
        const choice = index + 1;
        return (
          <Button
            key={choice}
            ref={(element) => {
              optionRefs.current[index] = element;
              if (index === 0) {
                firstAnswerControlRef.current = element;
              }
            }}
            type="button"
            variant="outline"
            className={cn(
              `
                h-14 w-full rounded-lg border p-0 text-sm font-semibold sm:rounded-full
                md:h-12 md:w-full md:justify-start md:rounded-md md:px-4
              `,
              selectedChoice === choice &&
                `
                  border-primary
                `,
            )}
            disabled={disabled}
            onClick={() => onSelect(choice)}
            onKeyDown={(event) => handleChoiceKeyDown(event, index)}
          >
            <span
              className={cn(
                `
                  grid size-6 place-items-center rounded-full border text-xs
                  font-semibold
                  md:mr-2
       `,
                selectedChoice === choice &&
                  `
                  border-primary
                `,
              )}
            >
              {choice}
            </span>
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
  firstAnswerControlRef,
}: {
  answerText: string;
  savedAnswerText?: string | null;
  disabled: boolean;
  onAnswerTextChange: (value: string) => void;
  onSave: (value: string) => void;
  firstAnswerControlRef: RefObject<
    HTMLButtonElement | HTMLTextAreaElement | null
  >;
}) {
  const value = answerText || savedAnswerText || '';

  return (
    <div className="grid gap-2">
      <Textarea
        ref={firstAnswerControlRef as RefObject<HTMLTextAreaElement>}
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

function SolveControlPanel({
  session,
  question,
  answer,
  answerText,
  currentIndex,
  answeredIds,
  disabled,
  hasCurrentAnswer,
  isFinishing,
  isAnswerRevealed,
  message,
  onAnswerTextChange,
  onSaveAnswer,
  onMoveTo,
  onRevealAnswer,
  onMoveToNextQuestion,
  firstAnswerControlRef,
}: {
  session: SolveSession;
  question: SolveQuestion;
  answer?: Answer;
  answerText: string;
  currentIndex: number;
  answeredIds: Set<string>;
  disabled: boolean;
  hasCurrentAnswer: boolean;
  isFinishing: boolean;
  isAnswerRevealed: boolean;
  message: string | null;
  onAnswerTextChange: (value: string) => void;
  onSaveAnswer: (payload: SaveAnswerPayload) => void;
  onMoveTo: (index: number) => void;
  onRevealAnswer: () => void;
  onMoveToNextQuestion: () => void;
  firstAnswerControlRef: RefObject<
    HTMLButtonElement | HTMLTextAreaElement | null
  >;
}) {
  const isPracticeMode = session.mode === 'ONE_BY_ONE';
  const canMoveNext = currentIndex < session.paper.questions.length - 1;

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
        firstAnswerControlRef={firstAnswerControlRef}
      />
      {isPracticeMode && isAnswerRevealed && (
        <ResultCheckPanel question={question} answer={answer} />
      )}
      <div className="mt-auto border-t pt-4">
        <Button
          type="button"
          className="w-full"
          disabled={
            disabled ||
            isFinishing ||
            (isPracticeMode ? !hasCurrentAnswer : !canMoveNext)
          }
          onClick={isPracticeMode ? onRevealAnswer : onMoveToNextQuestion}
        >
          {isPracticeMode ? (
            <Send data-icon="inline-start" />
          ) : (
            <ChevronRight data-icon="inline-start" />
          )}
          {isFinishing
            ? '처리 중...'
            : isPracticeMode
              ? '답안 제출하기'
              : '다음 문항'}
        </Button>
      </div>
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
    <section
      className="
        hidden
        md:grid md:gap-2
      "
    >
      <div
        className="
          grid grid-cols-[auto] gap-2
          md:grid-cols-[1fr_auto]
        "
      >
        <div className="hidden grid-cols-2 overflow-hidden rounded-md border md:grid">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="
              rounded-none text-primary hover:text-primary/80
              focus-visible:relative focus-visible:z-10 focus-visible:ring-inset
            "
            disabled={!canMovePrevious}
            onClick={() => onMoveTo(currentIndex - 1)}
          >
            <ChevronLeft data-icon="inline-start" />
            이전
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="
              rounded-none text-primary hover:text-primary/80
              focus-visible:relative focus-visible:z-10 focus-visible:ring-inset
            "
            disabled={!canMoveNext}
            onClick={() => onMoveTo(currentIndex + 1)}
          >
            다음
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
        <QuestionListDropdown
          questions={questions}
          currentIndex={currentIndex}
          answeredIds={answeredIds}
          onMoveTo={onMoveTo}
        />
      </div>
    </section>
  );
}

function QuestionListDropdown({
  questions,
  currentIndex,
  answeredIds,
  onMoveTo,
  compact = false,
}: {
  questions: SolveQuestion[];
  currentIndex: number;
  answeredIds: Set<string>;
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
          result?.isCorrect == null && 'bg-muted text-muted-foreground',
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
  if (result.gradingPolicy === 'ANY_CHOICE') return '모든 선택지';
  return result.answerChoice
    ? `${result.answerChoice}번`
    : (result.answerText ?? '등록된 정답 없음');
}

function getQuestionShareHref(paperId: string, questionNumber: number) {
  return `/resources/${paperId}/questions?question=${questionNumber}`;
}
