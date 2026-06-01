'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { promptDialog } from '@/shared/components/confirm-dialog';
import type { BookmarkListSummary } from '@/features/learning/types';
import { createBookmarkList as createBookmarkListApi } from '@/features/library/api/client';

export function BookmarkListManager({
  initialBookmarkLists,
}: {
  initialBookmarkLists: BookmarkListSummary[];
}) {
  const [bookmarkLists, setBookmarkLists] = useState(initialBookmarkLists);
  const [message, setMessage] = useState<string | null>(null);

  const createBookmarkList = async () => {
    const name = await promptDialog({
      title: '새 북마크 리스트',
      description: '새 북마크 리스트 이름을 입력해 주세요.',
      placeholder: '리스트 이름',
      confirmLabel: '만들기',
    });
    if (!name?.trim()) return;
    try {
      const bookmarkList = await createBookmarkListApi(name);
      setBookmarkLists((current) => [...current, bookmarkList]);
      setMessage('새 북마크 리스트를 만들었습니다.');
    } catch {
      setMessage('북마크 리스트를 만들지 못했습니다.');
    }
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900"> 북마크</h2>
          <p className="mt-1 text-sm text-zinc-500">
            풀이 중 저장한 개별 문제를 리스트별로 확인하세요.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={createBookmarkList}
        >
          <Plus />새 리스트
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-zinc-500">{message}</p>}
      {bookmarkLists.length === 0 ? (
        <p className="mt-5 text-sm text-zinc-500">
          북마크 리스트가 없습니다. 새 리스트를 만들어 문제를 모아보세요.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {bookmarkLists.map((list) => (
            <li key={list.id}>
              <Link href={`/library/bookmarks/${list.id}`} className="block">
                <Card className="transition hover:bg-zinc-50">
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
