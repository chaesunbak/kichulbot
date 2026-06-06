'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useState } from 'react';

import {
  createSolveSession,
  type SolveMode,
} from '@/features/learning/api/client';
import { SolveModeDialog } from '@/features/learning/components/solve-mode-dialog';
import { createLocalSolveSession } from '@/features/learning/lib/local-solve-session';

export function PaperSolveButton({
  paperId,
  isAuthenticated = false,
}: {
  paperId: string;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

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
      if (isAuthenticated) {
        const session = await createSolveSession({ paperId, mode });
        router.push(`/solve/${session.id}`);
        return;
      }

      const session = await createLocalSolveSession({ paperId, mode });
      router.push(`/solve/local/${session.id}`);
    } catch {
      setIsStarting(false);
      toast.error('풀이를 시작하지 못했습니다.');
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      disabled={isStarting}
      onClick={() => void chooseMode()}
    >
      <Play />
      {isStarting ? '준비 중' : '풀기'}
    </Button>
  );
}
