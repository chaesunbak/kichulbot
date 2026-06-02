'use client';

import { Button } from '@kichulbot/ui/components/button';
import { toast } from '@kichulbot/ui/components/sonner';
import { Textarea } from '@kichulbot/ui/components/textarea';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  saveSolveSessionAnswer,
  submitSolveSession,
} from '@/features/learning/api/client';
import { QuestionBookmarkButton } from '@/features/learning/components/question-bookmark-button';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import {
  formatClock,
  formatDuration,
  formatSolveMode,
} from '@/features/learning/lib/format';
import type {
  Answer,
  SolveQuestion,
  SolveSession,
} from '@/features/learning/types';
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
  const elapsedMilliseconds = useRef(0);
  const question = session.paper.questions[currentIndex];
  const answer = session.answers.find(
    (answer) => answer.questionId === question?.id,
  );

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
    const body = await saveSolveSessionAnswer({
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

  const finish = async () => {
    if (!question || session.submittedAt || isFinishing) return;
    setIsFinishing(true);
    setMessage('시험을 종료하는 중...');
    try {
      await saveProgress(question.id, { spentMilliseconds: takeElapsed() });
      await submitSolveSession(session.id);
      setMessage('결과 페이지로 이동 중입니다.');
      router.replace(`/results/${session.id}`);
    } catch {
      setIsFinishing(false);
      showFailureMessage('시험을 종료하지 못했습니다.');
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
    <div className="flex h-full flex-col overflow-hidden">
      <SolveSessionHeader
        title={session.paper.title}
        mode={session.mode}
        currentTime={currentTime}
        elapsedMilliseconds={totalElapsedMilliseconds}
        submitted={!!session.submittedAt}
        isFinishing={isFinishing}
        onFinish={finish}
      />

      <div
        className="
          grid min-h-0 flex-1 gap-3 overflow-hidden p-3
          md:grid-cols-[1fr_232px] md:gap-4 md:p-4
        "
      >
        <QuestionPanel
          question={question}
          answer={answer}
          answerText={answerText}
          currentIndex={currentIndex}
          questionCount={session.paper.questions.length}
          disabled={!!session.submittedAt}
          message={message}
          onAnswerTextChange={setAnswerText}
          onSaveAnswer={saveAnswer}
        />

        <SolveNavigation
          session={session}
          currentIndex={currentIndex}
          answeredIds={answeredIds}
          onMoveTo={moveTo}
        />
      </div>
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
  onFinish,
}: {
  title: string;
  mode: SolveSession['mode'];
  currentTime: Date;
  elapsedMilliseconds: number;
  submitted: boolean;
  isFinishing: boolean;
  onFinish: () => void;
}) {
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
        ) : (
          <Button
            type="button"
            variant="destructive"
            disabled={isFinishing}
            onClick={onFinish}
          >
            {isFinishing ? '종료 중...' : '시험 종료'}
          </Button>
        )}
      </div>
    </header>
  );
}

function QuestionPanel({
  question,
  answer,
  answerText,
  currentIndex,
  questionCount,
  disabled,
  message,
  onAnswerTextChange,
  onSaveAnswer,
}: {
  question: SolveQuestion;
  answer?: Answer;
  answerText: string;
  currentIndex: number;
  questionCount: number;
  disabled: boolean;
  message: string | null;
  onAnswerTextChange: (value: string) => void;
  onSaveAnswer: (payload: SaveAnswerPayload) => void;
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
      />
      <QuestionImage question={question} />
      <AnswerSection
        question={question}
        answer={answer}
        answerText={answerText}
        disabled={disabled}
        message={message}
        onAnswerTextChange={onAnswerTextChange}
        onSaveAnswer={onSaveAnswer}
      />
    </section>
  );
}

function QuestionHeader({
  question,
  currentIndex,
  questionCount,
}: {
  question: SolveQuestion;
  currentIndex: number;
  questionCount: number;
}) {
  return (
    <div
      className="
        flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3
      "
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{question.number}번</h2>
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
        <QuestionNoteButton questionId={question.id} />
        <QuestionBookmarkButton questionId={question.id} />
        <span className="text-sm text-zinc-500">
          {currentIndex + 1} / {questionCount}
        </span>
      </div>
    </div>
  );
}

function QuestionImage({ question }: { question: SolveQuestion }) {
  return (
    <div className="min-h-0 flex-1 bg-zinc-50 p-3">
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
  return (
    <div className="shrink-0 border-t px-4 py-3">
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

      <AnswerMeta answer={answer} message={message} />
    </div>
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
            variant={selectedChoice === choice ? 'default' : 'outline'}
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
        className="justify-self-end"
        disabled={disabled}
        onClick={() => onSave(value)}
      >
        임시 저장
      </Button>
    </div>
  );
}

function AnswerMeta({
  answer,
  message,
}: {
  answer?: Answer;
  message: string | null;
}) {
  return (
    <div
      className="
        mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500
      "
    >
      {answer && (
        <span>누적 풀이시간 {formatDuration(answer.spentMilliseconds)}</span>
      )}
      {message && <span>{message}</span>}
    </div>
  );
}

function SolveNavigation({
  session,
  currentIndex,
  answeredIds,
  onMoveTo,
}: {
  session: SolveSession;
  currentIndex: number;
  answeredIds: Set<string>;
  onMoveTo: (index: number) => void;
}) {
  return (
    <aside
      className="
        flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card p-4
      "
    >
      <h2 className="text-sm font-semibold">문제 번호</h2>
      <QuestionNumberGrid
        questions={session.paper.questions}
        currentIndex={currentIndex}
        answeredIds={answeredIds}
        onMoveTo={onMoveTo}
      />
    </aside>
  );
}

function QuestionNumberGrid({
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
  return (
    <div className="mt-3 grid shrink-0 grid-cols-5 gap-2">
      {questions.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            'h-8 rounded-md border text-sm',
            currentIndex === index && 'border-zinc-900 bg-zinc-900 text-white',
            currentIndex !== index &&
              answeredIds.has(item.id) &&
              'border-blue-300 bg-blue-50 text-blue-700',
          )}
          onClick={() => onMoveTo(index)}
        >
          {item.number}
        </button>
      ))}
    </div>
  );
}
