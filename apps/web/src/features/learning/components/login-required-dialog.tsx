'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import Link from 'next/link';
import { useEffect } from 'react';

export function LoginRequiredDialog({
  isOpen,
  title,
  description,
  nextPath,
  onClose,
  onExit,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  nextPath: string;
  onClose: () => void;
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
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
              로그인
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
