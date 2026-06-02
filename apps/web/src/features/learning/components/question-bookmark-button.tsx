'use client';

import { Button } from '@kichulbot/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import { BookmarkPlus } from 'lucide-react';
import { useState } from 'react';

import type { BookmarkListSummary } from '@/features/learning/types';
import {
  addQuestionToBookmarkList,
  getBookmarkLists,
} from '@/features/library/api/client';

export function QuestionBookmarkButton({ questionId }: { questionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState<BookmarkListSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const toggle = async () => {
    setIsOpen((current) => !current);
    if (lists) return;
    try {
      const bookmarkLists = await getBookmarkLists();
      setLists(bookmarkLists);
      setSelectedId(bookmarkLists[0]?.id ?? '');
    } catch {
      setMessage('리스트를 불러오지 못했습니다.');
    }
  };

  const addBookmark = async () => {
    if (!selectedId) return;
    setIsAdding(true);
    try {
      await addQuestionToBookmarkList({
        bookmarkListId: selectedId,
        questionId,
      });
      setMessage('선택한 리스트에 추가했습니다.');
    } catch {
      setMessage('북마크를 추가하지 못했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="relative">
      <Button type="button" variant="outline" size="sm" onClick={toggle}>
        <BookmarkPlus />
        북마크
      </Button>
      {isOpen && (
        <div
          className="
            absolute top-11 right-0 z-10 grid w-64 gap-3 rounded-lg border
            bg-card p-3
          "
        >
          {lists?.length ? (
            <>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger
                  aria-label="추가할 북마크 리스트 선택"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
