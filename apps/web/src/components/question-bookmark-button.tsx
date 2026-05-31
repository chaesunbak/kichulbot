'use client';

import { useState } from 'react';
import { BookmarkPlus } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@kichulbot/ui/components/native-select';
import type { BookmarkListSummary } from '@/lib/learning';

export function QuestionBookmarkButton({ questionId }: { questionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<BookmarkListSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const toggle = async () => {
    setIsOpen((current) => !current);
    if (lists) return;
    const response = await fetch('/api/bookmark-lists');
    if (!response.ok) return setMessage('리스트를 불러오지 못했습니다.');
    const body = (await response.json()) as {
      bookmarkLists: BookmarkListSummary[];
    };
    setLists(body.bookmarkLists);
    setSelectedId(body.bookmarkLists[0]?.id ?? '');
  };

  const addBookmark = async () => {
    if (!selectedId) return;
    setIsAdding(true);
    const response = await fetch(
      `/api/bookmark-lists/${selectedId}/questions/${questionId}`,
      { method: 'POST' },
    );
    setIsAdding(false);
    setMessage(
      response.ok
        ? '선택한 리스트에 추가했습니다.'
        : '북마크를 추가하지 못했습니다.',
    );
  };

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={toggle}>
        <BookmarkPlus />
        북마크
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-11 z-10 grid w-64 gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
          {lists?.length ? (
            <>
              <NativeSelect
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                aria-label="추가할 북마크 리스트 선택"
              >
                {lists.map((list) => (
                  <NativeSelectOption key={list.id} value={list.id}>
                    {list.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <Button
                type="button"
                size="sm"
                disabled={isAdding}
                onClick={addBookmark}
              >
                {isAdding ? '추가 중' : '리스트에 추가'}
              </Button>
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              내책장 페이지에서 북마크 리스트를 먼저 만들어 주세요.
            </p>
          )}
          {message && <p className="text-xs text-zinc-500">{message}</p>}
        </div>
      )}
    </div>
  );
}
