'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { BookCheck, BookPlus, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { useState } from 'react';

import { addExamPaperToLibrary } from '@/features/papers/api/client';

const MIN_ADDING_DURATION_MS = 400;

export function PaperBookmarkButton({
  paperId,
  initialIsInLibrary = false,
  isAuthenticated = false,
}: {
  paperId: string;
  initialIsInLibrary?: boolean;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInLibrary, setIsInLibrary] = useState(initialIsInLibrary);
  const [isAdding, setIsAdding] = useState(false);

  const addToLibrary = async (targetFolderId: string | null) => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAdding(true);
    try {
      await Promise.all([
        addExamPaperToLibrary(paperId, targetFolderId),
        delay(MIN_ADDING_DURATION_MS),
      ]);
      posthog.capture('paper_added_to_library', { paper_id: paperId });
      setIsInLibrary(true);
      router.refresh();
    } catch {
      toast.error('내 서재 추가에 실패했습니다.');
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
      onClick={() => addToLibrary(null)}
    >
      {isAdding ? (
        <Loader2 className="animate-spin" />
      ) : isInLibrary ? (
        <BookCheck />
      ) : (
        <BookPlus />
      )}
      {isAdding ? '추가 중' : isInLibrary ? '추가됨' : '내 서재에 추가'}
    </Button>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
