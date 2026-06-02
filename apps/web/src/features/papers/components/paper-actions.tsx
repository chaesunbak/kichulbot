'use client';

import { Button } from '@kichulbot/ui/components/button';
import { toast } from '@kichulbot/ui/components/sonner';
import { BookCheck, BookPlus, Loader2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import {
  createSolveSession,
  type SolveMode,
} from '@/features/learning/api/client';
import { SolveModeDialog } from '@/features/learning/components/solve-mode-dialog';
import { addExamPaperToLibrary } from '@/features/papers/api/client';

const MIN_ADDING_DURATION_MS = 400;

export function PaperActions({
  paperId,
  initialIsInLibrary = false,
}: {
  paperId: string;
  initialIsInLibrary?: boolean;
}) {
  const router = useRouter();
  const [isInLibrary, setIsInLibrary] = useState(initialIsInLibrary);
  const [isAdding, setIsAdding] = useState(false);

  const [isStarting, setIsStarting] = useState(false);

  const addToLibrary = async (targetFolderId: string | null) => {
    setIsAdding(true);
    try {
      await Promise.all([
        addExamPaperToLibrary(paperId, targetFolderId),
        delay(MIN_ADDING_DURATION_MS),
      ]);
      setIsInLibrary(true);
      router.refresh();
    } catch {
      toast.error('내 서재 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

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
      const session = await createSolveSession({ paperId, mode });
      router.push(`/solve/${session.id}`);
    } catch {
      setIsStarting(false);
      toast.error('풀이를 시작하지 못했습니다.');
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
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
        <Button
          type="button"
          size="sm"
          disabled={isStarting}
          onClick={() => void chooseMode()}
        >
          <Play />
          {isStarting ? '준비 중' : '풀기'}
        </Button>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
