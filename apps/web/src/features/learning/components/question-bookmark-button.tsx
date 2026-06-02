'use client';

import { Button } from '@kichulbot/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/dialog';
import { toast } from '@kichulbot/ui/components/sonner';
import { BookmarkPlus, Loader2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useEffect, useState } from 'react';

import type { BookmarkListSummary } from '@/features/learning/types';
import {
  addQuestionToBookmarkList,
  getBookmarkLists,
} from '@/features/library/api/client';

export function QuestionBookmarkButton({ questionId }: { questionId: string }) {
  const [isAdding, setIsAdding] = useState(false);

  const addBookmark = async () => {
    setIsAdding(true);
    try {
      const bookmarkLists = await getBookmarkLists();
      const bookmarkListId = await overlay.openAsync<string | null>(
        ({ isOpen, close, unmount }) => (
          <QuestionBookmarkDialog
            isOpen={isOpen}
            bookmarkLists={bookmarkLists}
            onCancel={() => close(null)}
            onSelect={(selectedId) => close(selectedId)}
            onExit={unmount}
          />
        ),
      );
      if (!bookmarkListId) return;

      await addQuestionToBookmarkList({
        bookmarkListId,
        questionId,
      });
      toast.success('선택한 리스트에 추가했습니다.');
    } catch {
      toast.error('북마크를 추가하지 못했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isAdding}
      onClick={() => void addBookmark()}
    >
      {isAdding ? <Loader2 className="animate-spin" /> : <BookmarkPlus />}
      {isAdding ? '추가 중' : '북마크'}
    </Button>
  );
}

function QuestionBookmarkDialog({
  isOpen,
  bookmarkLists,
  onCancel,
  onSelect,
  onExit,
}: {
  isOpen: boolean;
  bookmarkLists: BookmarkListSummary[];
  onCancel: () => void;
  onSelect: (bookmarkListId: string) => void;
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
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>어디에 추가할까요?</DialogTitle>
          <DialogDescription>
            이 문제를 추가할 북마크 리스트를 선택해 주세요.
          </DialogDescription>
        </DialogHeader>
        {bookmarkLists.length ? (
          <div className="grid gap-2">
            {bookmarkLists.map((list) => (
              <button
                key={list.id}
                type="button"
                className="
                  flex min-h-16 w-full items-center justify-between gap-3
                  rounded-lg border border-zinc-200 bg-white p-4 text-left
                  transition
                  hover:border-zinc-300 hover:bg-zinc-50
                  focus-visible:ring-2 focus-visible:ring-zinc-950
                  focus-visible:ring-offset-2 focus-visible:outline-none
                "
                onClick={() => onSelect(list.id)}
              >
                <span className="grid gap-1">
                  <span className="text-sm font-medium text-zinc-900">
                    {list.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    저장한 문제 {list.questionCount}개
                  </span>
                </span>
                <BookmarkPlus className="size-4 shrink-0 text-zinc-500" />
              </button>
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              내책장 페이지에서 북마크 리스트를 먼저 만들어 주세요.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                닫기
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
