'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookCheck, BookPlus, Play } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import type { Bookshelf } from '@/lib/learning.types';

export function PaperActions({
  paperId,
  initialIsInLibrary = false,
}: {
  paperId: string;
  initialIsInLibrary?: boolean;
}) {
  const router = useRouter();
  const [isInLibrary, setIsInLibrary] = useState(initialIsInLibrary);
  const [message, setMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isChoosingBookshelf, setIsChoosingBookshelf] = useState(false);
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [bookshelfId, setBookshelfId] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isChoosingMode, setIsChoosingMode] = useState(false);

  const chooseBookshelf = async () => {
    if (isChoosingBookshelf) return setIsChoosingBookshelf(false);
    setMessage(null);
    const response = await fetch('/api/me/paper-lists');
    if (!response.ok) return setMessage('책장 목록을 불러오지 못했습니다.');
    const body = (await response.json()) as { bookshelves: Bookshelf[] };
    setBookshelves(body.bookshelves);
    setBookshelfId(body.bookshelves[0]?.id ?? '');
    setIsChoosingBookshelf(true);
  };

  const addToLibrary = async () => {
    if (!bookshelfId) return;
    setIsAdding(true);
    setMessage(null);
    const response = await fetch(
      `/api/me/paper-lists/${bookshelfId}/exam-papers/${paperId}`,
      {
        method: 'PUT',
      },
    );
    setIsAdding(false);
    if (response.ok) {
      setIsInLibrary(true);
      setIsChoosingBookshelf(false);
      setMessage('선택한 책장에 추가했습니다.');
      router.refresh();
    } else {
      setMessage('책장 추가에 실패했습니다.');
    }
  };

  const start = async (mode: 'ONE_BY_ONE' | 'EXAM') => {
    setIsStarting(true);
    setMessage(null);
    const response = await fetch('/api/me/solve-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId, mode }),
    });
    if (!response.ok) {
      setIsStarting(false);
      setMessage('풀이를 시작하지 못했습니다.');
      return;
    }
    const body = (await response.json()) as { session: { id: string } };
    router.push(`/solve/${body.session.id}`);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isAdding}
          onClick={chooseBookshelf}
        >
          {isInLibrary ? <BookCheck /> : <BookPlus />}
          {isAdding ? '추가 중' : '책장에 추가'}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isStarting}
          onClick={() => setIsChoosingMode((current) => !current)}
        >
          <Play />
          {isStarting ? '준비 중' : '풀기'}
        </Button>
      </div>
      {isChoosingBookshelf && !isAdding && (
        <div className="mt-3 flex flex-wrap gap-2 rounded-lg bg-zinc-50 p-3">
          {bookshelves.length === 0 ? (
            <p className="text-xs text-zinc-500">
              내 책장 페이지에서 책장을 먼저 만들어 주세요.
            </p>
          ) : (
            <>
              <Select value={bookshelfId} onValueChange={setBookshelfId}>
                <SelectTrigger aria-label="추가할 책장 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bookshelves.map((bookshelf) => (
                    <SelectItem key={bookshelf.id} value={bookshelf.id}>
                      {bookshelf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={addToLibrary}>
                추가
              </Button>
            </>
          )}
        </div>
      )}
      {isChoosingMode && !isStarting && (
        <div className="mt-3 grid gap-2 rounded-lg bg-zinc-50 p-3 text-xs">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => start('ONE_BY_ONE')}
          >
            한 문제씩 풀기
          </Button>
          <p className="text-zinc-500">
            문제를 푼 직후 정답과 해설을 확인합니다.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => start('EXAM')}
          >
            한번에 풀기
          </Button>
          <p className="text-zinc-500">
            시험 종료 후 결과와 해설을 확인합니다.
          </p>
        </div>
      )}
      {message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
