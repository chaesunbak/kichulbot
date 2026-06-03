'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Bookmark, Plus } from 'lucide-react';
import Link from 'next/link';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import type { BookmarkListSummary } from '@/features/learning/types';
import { createBookmarkList as createBookmarkListApi } from '@/features/library/api/client';
import { PromptDialog } from '@/shared/components/prompt-dialog';

export function BookmarkListManager({
  initialBookmarkLists,
}: {
  initialBookmarkLists: BookmarkListSummary[];
}) {
  const [bookmarkLists, setBookmarkLists] = useState(initialBookmarkLists);

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
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-zinc-900">북마크</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={createBookmarkList}
        >
          <Plus />새 리스트
        </Button>
      </div>
      {bookmarkLists.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-500">
          북마크 리스트가 없습니다. 새 리스트를 만들어 문제를 모아보세요.
        </p>
      ) : (
        <ul
          className="
            mt-5 grid gap-4
            sm:grid-cols-2
          "
        >
          {bookmarkLists.map((list) => (
            <li key={list.id}>
              <Link href={`/library/bookmarks/${list.id}`} className="block">
                <Card
                  className="
                    transition
                    hover:bg-zinc-50
                  "
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bookmark className="size-4" />
                      {list.name}
                    </CardTitle>
                    <CardDescription>
                      {list.questionCount}개 문제
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
