'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import { createBookmarkListSolveSession } from '@/features/learning/api/client/mutations';
import { SolveModeDialog } from '@/features/learning/components/solve-mode-dialog';
import type { BookmarkList, SolveMode } from '@/features/learning/types';
import { removeQuestionFromBookmarkList } from '@/features/library/api/client/mutations';
import { PageTitle } from '@/shared/components/page-title';

import { BookmarkListItem } from './bookmark-list-item';
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
            <BookmarkListItem
              key={question.id}
              disabled={isStarting || isDeleting}
              question={question}
              onRemove={(questionId) => void removeQuestion(questionId)}
            />
          ))}
        </ul>
      )}
    </>
  );
}
