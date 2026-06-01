'use client';

import { Button } from '@kichulbot/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/dialog';
import { Input } from '@kichulbot/ui/components/input';
import { type ReactNode, useEffect, useState } from 'react';

type PromptDialogProps = {
  isOpen: boolean;
  title: ReactNode;
  description?: ReactNode;
  defaultValue?: string;
  placeholder?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
  onExit: () => void;
};

export function PromptDialog({
  isOpen,
  title,
  description,
  defaultValue = '',
  placeholder,
  cancelLabel = '취소',
  confirmLabel = '확인',
  onCancel,
  onConfirm,
  onExit,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);

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
        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(value);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription className="whitespace-pre-line">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <Input
            autoFocus
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button type="submit">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
