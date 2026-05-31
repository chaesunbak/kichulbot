'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Trash2 } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';

export function LibraryPaperActions({
  bookshelfId,
  paperId,
}: {
  bookshelfId: string;
  paperId: string;
}) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const start = async (mode: 'ONE_BY_ONE' | 'EXAM') => {
    setIsStarting(true);
    setMessage(null);
    const response = await fetch('/api/answer-sessions', {
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

  const remove = async () => {
    if (!window.confirm('이 책장에서 문제지를 제거할까요?')) return;
    setIsDeleting(true);
    setMessage(null);
    const response = await fetch(
      `/api/library/bookshelves/${bookshelfId}/papers/${paperId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      setIsDeleting(false);
      setMessage('문제지를 제거하지 못했습니다.');
      return;
    }
    router.push('/library');
    router.refresh();
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isStarting || isDeleting}
          onClick={() => start('ONE_BY_ONE')}
        >
          <Play />한 문제씩 풀기
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isStarting || isDeleting}
          onClick={() => start('EXAM')}
        >
          <Play />
          한번에 풀기
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isStarting || isDeleting}
          onClick={remove}
        >
          <Trash2 />
          {isDeleting ? '제거 중' : '책장에서 제거'}
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-destructive">{message}</p>}
    </div>
  );
}
