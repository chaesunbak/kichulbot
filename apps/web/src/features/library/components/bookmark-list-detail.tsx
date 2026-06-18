'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Play, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import { createBookmarkListSolveSession } from '@/features/learning/api/client/mutations';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import { SolveModeDialog } from '@/features/learning/components/solve-mode-dialog';
import type { BookmarkList, SolveMode } from '@/features/learning/types';
import { removeQuestionFromBookmarkList } from '@/features/library/api/client/mutations';
import { PageTitle } from '@/shared/components/page-title';

import { DeleteBookmarkListButton } from './delete-bookmark-list-button';
import { RenameBookmarkListButton } from './rename-bookmark-list-button';

export function BookmarkListDetail({
  initialList,
}: {
  initialList: BookmarkList;
}) {
  const router = useRouter();
  const [bookmarkList, setBookmarkList] = useState(initialList);
  const [questions, setQuestions] = useState(initialList.questions);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    try {
      const session = await createBookmarkListSolveSession({
        bookmarkListId: bookmarkList.id,
        mode,
      });
      router.push(`/solve/${session.id}`);
    } catch {
      toast.error('풀이를 시작하지 못했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      await removeQuestionFromBookmarkList({
        bookmarkListId: bookmarkList.id,
        questionId,
      });
      setQuestions((current) =>
        current.filter((question) => question.id !== questionId),
      );
      toast.success('북마크를 제거했습니다.');
    } catch {
      toast.error('북마크를 제거하지 못했습니다.');
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <PageTitle>{bookmarkList.name}</PageTitle>
          <div className="mt-2 text-sm text-muted-foreground">
            {questions.length}개
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {questions.length > 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={isStarting || isDeleting}
              onClick={() => void chooseMode()}
            >
              <Play />
              {isStarting ? '준비 중' : '풀기'}
            </Button>
          ) : null}
          <RenameBookmarkListButton
            bookmarkList={bookmarkList}
            disabled={isDeleting}
            onRenamed={(updated) =>
              setBookmarkList((current) => ({ ...current, ...updated }))
            }
          />
          <DeleteBookmarkListButton
            bookmarkList={bookmarkList}
            disabled={isDeleting}
            onDeletingChange={setIsDeleting}
          />
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          아직 저장한 문제가 없습니다.
        </p>
      ) : (
        <ul className="mt-6 grid gap-5">
          {questions.map((question) => (
            <li key={question.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">
                    {question.paper.title} {question.number}번
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question.paper.examName} · {question.paper.year}학년도
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <QuestionNoteButton questionId={question.id} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isStarting || isDeleting}
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
                    mt-4 rounded-lg bg-muted px-4 py-10 text-center text-sm
                    text-muted-foreground
                  "
                >
                  문제 이미지가 없습니다.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
