'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import { type ReactNode, useEffect } from 'react';

import type { SolveMode } from '@/features/learning/api/client';

export function SolveModeDialog({
  isOpen,
  onCancel,
  onSelect,
  onExit,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onSelect: (mode: SolveMode) => void;
  onExit: () => void;
}) {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>풀이 모드를 선택해주세요</DialogTitle>
          <DialogDescription>
            풀이 진행 방식에 따라 정답과 해설을 확인하는 시점이 달라집니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <SolveModeButton
            title="연습모드"
            description="문제를 푼 직후 정답과 해설을 확인합니다."
            onClick={() => onSelect('ONE_BY_ONE')}
          />
          <SolveModeButton
            title="시험모드"
            description="전체 답안을 제출한 뒤 결과와 해설을 확인합니다."
            onClick={() => onSelect('EXAM')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SolveModeButton({
  title,
  description,
  onClick,
}: {
  title: ReactNode;
  description: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="
        flex min-h-20 w-full items-center gap-3 rounded-lg border
        border-zinc-200 bg-white p-4 text-left transition
        hover:border-zinc-300 hover:bg-zinc-50
        focus-visible:ring-2 focus-visible:ring-zinc-950
        focus-visible:ring-offset-2 focus-visible:outline-none
      "
      onClick={onClick}
    >
      <span className="grid gap-1">
        <span className="text-sm font-medium text-zinc-900">{title}</span>
        <span className="text-xs/5 text-zinc-500">{description}</span>
      </span>
    </button>
  );
}
