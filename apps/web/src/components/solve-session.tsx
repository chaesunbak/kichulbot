'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@kichulbot/ui/components/button';
import { Textarea } from '@kichulbot/ui/components/textarea';
import type {
  AnswerSession,
  DraftAnswer,
  QuestionResult,
} from '@/lib/learning';
import { cn } from '@/lib/utils';

export function SolveSession({
  initialSession,
}: {
  initialSession: AnswerSession;
}) {
  const [session, setSession] = useState(initialSession);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const elapsedMilliseconds = useRef(0);
  const question = session.paper.questions[currentIndex];
  const draft = session.draftAnswers.find(
    (answer) => answer.questionId === question?.id,
  );

  const answeredIds = useMemo(
    () =>
      new Set(
        session.draftAnswers
          .filter(
            (answer) =>
              answer.answerChoice !== null || answer.answerText !== null,
          )
          .map((answer) => answer.questionId),
      ),
    [session.draftAnswers],
  );

  useEffect(() => {
    if (session.submittedAt) return;
    const timer = window.setInterval(() => {
      elapsedMilliseconds.current += 1000;
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
    const response = await fetch(
      `/api/answer-sessions/${session.id}/answers/${questionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) throw new Error('저장 실패');
    const body = (await response.json()) as {
      draftAnswer: DraftAnswer;
      result: QuestionResult | null;
    };
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
      draftAnswers: [
        ...current.draftAnswers.filter(
          (answer) => answer.questionId !== questionId,
        ),
        body.draftAnswer,
      ],
    }));
  };

  const takeElapsed = () => {
    const elapsed = elapsedMilliseconds.current;
    elapsedMilliseconds.current = 0;
    return elapsed;
  };

  const saveAnswer = async (payload: {
    answerChoice?: number;
    answerText?: string;
  }) => {
    if (!question || session.submittedAt) return;
    setMessage('저장 중...');
    try {
      await saveProgress(question.id, {
        ...payload,
        spentMilliseconds: takeElapsed(),
      });
      setMessage('저장했습니다.');
    } catch {
      setMessage('답안을 저장하지 못했습니다.');
    }
  };

  const moveTo = async (index: number) => {
    if (!question || index === currentIndex) return;
    if (!session.submittedAt) {
      try {
        await saveProgress(question.id, { spentMilliseconds: takeElapsed() });
      } catch {
        setMessage('풀이 시간을 저장하지 못했습니다.');
      }
    }
    setCurrentIndex(index);
    setAnswerText('');
    setMessage(null);
    elapsedMilliseconds.current = 0;
  };

  const finish = async () => {
    if (!question || session.submittedAt) return;
    setMessage('시험을 종료하는 중...');
    try {
      await saveProgress(question.id, { spentMilliseconds: takeElapsed() });
      const response = await fetch(
        `/api/answer-sessions/${session.id}/submit`,
        {
          method: 'POST',
        },
      );
      if (!response.ok) throw new Error('종료 실패');
      const body = (await response.json()) as { session: AnswerSession };
      setSession(body.session);
      setMessage('시험을 종료했습니다. 정답과 해설을 확인해보세요.');
    } catch {
      setMessage('시험을 종료하지 못했습니다.');
    }
  };

  if (!question) {
    return <p className="text-sm text-zinc-500">등록된 문항이 없습니다.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{question.number}번</h2>
            {question.recommendedTimeSeconds && (
              <p className="mt-1 text-xs text-zinc-500">
                권장 풀이시간{' '}
                {formatDuration(question.recommendedTimeSeconds * 1000)}
              </p>
            )}
          </div>
          <span className="text-sm text-zinc-500">
            {currentIndex + 1} / {session.paper.questions.length}
          </span>
        </div>

        {question.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.imageUrl}
            alt={`${question.number}번 문제`}
            className="mt-5 max-h-[560px] w-full rounded-lg object-contain"
          />
        ) : (
          <p className="mt-5 rounded-lg bg-zinc-50 px-4 py-12 text-center text-sm text-zinc-500">
            문제 이미지가 없습니다.
          </p>
        )}

        {question.type === 'MULTIPLE_CHOICE' ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: question.choiceCount ?? 0 }, (_, index) => {
              const choice = index + 1;
              return (
                <Button
                  key={choice}
                  type="button"
                  variant={
                    draft?.answerChoice === choice ? 'default' : 'outline'
                  }
                  disabled={!!session.submittedAt}
                  onClick={() => saveAnswer({ answerChoice: choice })}
                >
                  {choice}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 grid gap-2">
            <Textarea
              value={answerText || draft?.answerText || ''}
              disabled={!!session.submittedAt}
              placeholder="답안을 입력해주세요."
              onChange={(event) => setAnswerText(event.target.value)}
            />
            <Button
              type="button"
              className="justify-self-end"
              disabled={!!session.submittedAt}
              onClick={() =>
                saveAnswer({
                  answerText: answerText || draft?.answerText || '',
                })
              }
            >
              임시 저장
            </Button>
          </div>
        )}

        {question.result && <QuestionResultPanel result={question.result} />}
        {draft && (
          <p className="mt-3 text-xs text-zinc-500">
            누적 풀이시간 {formatDuration(draft.spentMilliseconds)}
          </p>
        )}
        {message && <p className="mt-3 text-xs text-zinc-500">{message}</p>}
      </section>

      <aside className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs text-zinc-500">
          {session.mode === 'ONE_BY_ONE' ? '한 문제씩 풀기' : '한번에 풀기'}
        </p>
        <h2 className="mt-1 text-sm font-semibold">문제 번호</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {session.paper.questions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'h-8 rounded-md border text-sm',
                currentIndex === index &&
                  'border-zinc-900 bg-zinc-900 text-white',
                currentIndex !== index &&
                  answeredIds.has(item.id) &&
                  'border-blue-300 bg-blue-50 text-blue-700',
              )}
              onClick={() => void moveTo(index)}
            >
              {item.number}
            </button>
          ))}
        </div>
        {session.submittedAt ? (
          <p className="mt-5 text-center text-xs text-zinc-500">종료 완료</p>
        ) : (
          <Button
            type="button"
            variant="destructive"
            className="mt-5 w-full"
            onClick={finish}
          >
            시험 종료
          </Button>
        )}
      </aside>
    </div>
  );
}

function QuestionResultPanel({ result }: { result: QuestionResult }) {
  return (
    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
      <p className="font-semibold text-blue-900">
        {result.isCorrect === null
          ? '정답 확인'
          : result.isCorrect
            ? '정답입니다.'
            : '오답입니다.'}
      </p>
      <p className="mt-2 text-blue-900">
        정답:{' '}
        {result.answerChoice ? `${result.answerChoice}번` : result.answerText}
      </p>
      {result.explanation && (
        <p className="mt-2 whitespace-pre-wrap text-blue-800">
          {result.explanation}
        </p>
      )}
    </div>
  );
}

function formatDuration(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}
