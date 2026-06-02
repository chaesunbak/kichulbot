'use client';

import { Button } from '@kichulbot/ui/components/button';
import { Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import {
  createBookmarkListSolveSession,
  type SolveMode,
} from '@/features/learning/api/client';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import { SolveModeDialog } from '@/features/learning/components/solve-mode-dialog';
import type { BookmarkList } from '@/features/learning/types';
import { removeQuestionFromBookmarkList } from '@/features/library/api/client';

export function BookmarkListDetail({
  initialList,
}: {
  initialList: BookmarkList;
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialList.questions);
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const chooseMode = async () => {
    const mode = await overlay.openAsync<SolveMode | null>(
      ({ isOpen, close, unmount }) => (
        <SolveModeDialog
          isOpen={isOpen}
          onCancel={() => close(null)}
          onSelect={(selectedMode) => close(selectedMode)}
          onExit={unmount}
        />
      ),
    );
    if (!mode) return;

    await start(mode);
  };

  const start = async (mode: SolveMode) => {
    setIsStarting(true);
    setMessage(null);
    try {
      const session = await createBookmarkListSolveSession({
        bookmarkListId: initialList.id,
        mode,
      });
      router.push(`/solve/${session.id}`);
    } catch {
      setIsStarting(false);
      setMessage('풀이를 시작하지 못했습니다.');
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      await removeQuestionFromBookmarkList({
        bookmarkListId: initialList.id,
        questionId,
      });
      setQuestions((current) =>
        current.filter((question) => question.id !== questionId),
      );
      setMessage('북마크를 제거했습니다.');
    } catch {
      setMessage('북마크를 제거하지 못했습니다.');
    }
  };

  if (questions.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500">아직 저장한 문제가 없습니다.</p>
    );
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isStarting}
          onClick={() => void chooseMode()}
        >
          <Play />
          {isStarting ? '준비 중' : '풀기'}
        </Button>
      </div>
      {message && <p className="mt-4 text-sm text-zinc-500">{message}</p>}
      <ul className="mt-6 grid gap-5">
        {questions.map((question) => (
          <li key={question.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-zinc-900">
                  {question.paper.title} {question.number}번
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {question.paper.examName} · {question.paper.year}학년도
                </p>
              </div>
              <div className="flex items-center gap-2">
                <QuestionNoteButton questionId={question.id} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isStarting}
                  onClick={() => void removeQuestion(question.id)}
                >
                  <Trash2 />
                  제거
                </Button>
              </div>
            </div>
            {question.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.imageUrl}
                alt={`${question.paper.title} ${question.number}번 문제`}
                className="mt-4 max-h-140 w-full rounded-lg object-contain"
              />
            ) : (
              <p
                className="
                  mt-4 rounded-lg bg-zinc-50 px-4 py-10 text-center text-sm
                  text-zinc-500
                "
              >
                문제 이미지가 없습니다.
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
