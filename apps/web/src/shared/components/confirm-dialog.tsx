'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kichulbot/ui/components/ui/alert-dialog';
import { Button } from '@kichulbot/ui/components/ui/button';
import { type ReactNode, useEffect } from 'react';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: ReactNode;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  closeOnDimmerClick?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onExit: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  cancelLabel = '취소',
  confirmLabel = '확인',
  destructive = false,
  closeOnDimmerClick = true,
  onCancel,
  onConfirm,
  onExit,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent
        dimmerProps={closeOnDimmerClick ? { onClick: onCancel } : undefined}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="whitespace-pre-line">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
