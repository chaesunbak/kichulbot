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
import { BookmarkPlus, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import type { BookmarkListSummary } from '@/features/learning/types';
import {
  addQuestionToBookmarkList,
  createBookmarkList as createBookmarkListApi,
  getBookmarkLists,
} from '@/features/library/api/client';
import { PromptDialog } from '@/shared/components/prompt-dialog';

export function QuestionBookmarkButton({
  questionId,
  isAuthenticated = true,
}: {
  questionId: string;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();
  const [bookmarkLists, setBookmarkLists] = useState<BookmarkListSummary[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadBookmarkLists = async () => {
    if (!isAuthenticated) return;

    setIsLoadingLists(true);
    try {
      const lists = await getBookmarkLists();
      setBookmarkLists(lists);
    } catch {
      toast.error('북마크 리스트를 불러오지 못했습니다.');
    } finally {
      setIsLoadingLists(false);
    }
  };

  const addBookmark = async (bookmarkListId: string) => {
    setIsAdding(true);
    try {
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

  const createBookmarkList = async () => {
    const name = await overlay.openAsync<string | null>(
      ({ isOpen, close, unmount }) => (
        <PromptDialog
          isOpen={isOpen}
          title="새 북마크 리스트"
          description="새 북마크 리스트 이름을 입력해 주세요."
          placeholder="리스트 이름"
          confirmLabel="만들기"
          onCancel={() => close(null)}
          onConfirm={(value) => close(value)}
          onExit={unmount}
        />
      ),
    );
    if (!name?.trim()) return;
    try {
      const bookmarkList = await createBookmarkListApi(name);
      setBookmarkLists((current) => [...current, bookmarkList]);
      toast.success('새 북마크 리스트를 만들었습니다.');
    } catch {
      toast.error('북마크 리스트를 만들지 못했습니다.');
    }
  };

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) void loadBookmarkLists();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={isAdding}>
          {isAdding ? <Loader2 className="animate-spin" /> : <BookmarkPlus />}
          {isAdding ? '추가 중' : '북마크'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {!isAuthenticated ? (
          <div className="grid gap-3 p-3">
            <div className="grid gap-1">
              <p className="text-sm font-medium text-zinc-900">
                로그인이 필요합니다
              </p>
              <p className="text-xs text-zinc-500">
                로그인하면 문항을 북마크 리스트에 저장할 수 있습니다.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                로그인
              </Link>
            </Button>
          </div>
        ) : isLoadingLists ? (
          <DropdownMenuItem disabled>
            <Loader2 className="animate-spin" />
            리스트 불러오는 중
          </DropdownMenuItem>
        ) : (
          <>
            {bookmarkLists.length ? (
              bookmarkLists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  className="items-start"
                  disabled={isAdding}
                  onSelect={() => void addBookmark(list.id)}
                >
                  <BookmarkPlus className="mt-0.5" />
                  <span className="grid gap-0.5">
                    <span>{list.name}</span>
                    <span className="text-xs font-normal text-zinc-500">
                      저장한 문제 {list.questionCount}개
                    </span>
                  </span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-zinc-500">
                북마크 리스트가 없습니다.
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setIsOpen(false);
                window.setTimeout(() => {
                  void createBookmarkList();
                });
              }}
            >
              <Plus />
              리스트 추가
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
