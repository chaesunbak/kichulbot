'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { useRouter } from 'next/navigation';
import { overlay } from 'overlay-kit';
import { useEffect, useState } from 'react';

import { updateCurrentStudyWeeklyGoal } from '@/features/study-weekly-goals/api/client/mutations';
import { cn } from '@/shared/lib/utils';

const TARGET_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

interface WeeklyStudyGoalSetterButtonProps {
  defaultTargetDays: number;
}

export function WeeklyStudyGoalSetterButton({
  defaultTargetDays,
}: WeeklyStudyGoalSetterButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const openGoalDialog = async () => {
    const targetDays = await overlay.openAsync<number | null>(
      ({ isOpen, close, unmount }) => (
        <WeeklyStudyGoalDialog
          defaultTargetDays={defaultTargetDays}
          isOpen={isOpen}
          onCancel={() => close(null)}
          onExit={unmount}
          onSelect={(selectedTargetDays) => close(selectedTargetDays)}
        />
      ),
    );
    if (!targetDays) return;

    setIsPending(true);
    try {
      await updateCurrentStudyWeeklyGoal(targetDays);
      router.refresh();
    } catch {
      toast.error('주간 학습 목표를 설정하지 못했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 rounded-full"
      disabled={isPending}
      onClick={() => void openGoalDialog()}
    >
      목표 설정
    </Button>
  );
}

interface WeeklyStudyGoalDialogProps {
  defaultTargetDays: number;
  isOpen: boolean;
  onCancel: () => void;
  onExit: () => void;
  onSelect: (targetDays: number) => void;
}

function WeeklyStudyGoalDialog({
  defaultTargetDays,
  isOpen,
  onCancel,
  onExit,
  onSelect,
}: WeeklyStudyGoalDialogProps) {
  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>이번 주 목표 설정</DialogTitle>
          <DialogDescription>
            이번 주에 공부할 날짜 수를 선택해주세요. 설정한 뒤에는 이번 주 동안
            바꿀 수 없어요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-7 gap-2">
          {TARGET_DAY_OPTIONS.map((targetDays) => (
            <Button
              key={targetDays}
              type="button"
              variant={targetDays === defaultTargetDays ? 'default' : 'outline'}
              className={cn('aspect-square rounded-full p-0 text-sm font-bold')}
              onClick={() => onSelect(targetDays)}
            >
              {targetDays}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
