'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { overlay } from 'overlay-kit';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kichulbot/ui/components/alert-dialog';
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

type ConfirmDialogOptions = {
  title: ReactNode;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type PromptDialogOptions = {
  title: ReactNode;
  description?: ReactNode;
  defaultValue?: string;
  placeholder?: string;
  cancelLabel?: string;
  confirmLabel?: string;
};

export function confirmDialog(options: ConfirmDialogOptions) {
  return overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
    <ConfirmOverlay
      {...options}
      isOpen={isOpen}
      onCancel={() => close(false)}
      onConfirm={() => close(true)}
      onExit={unmount}
    />
  ));
}

export function promptDialog(options: PromptDialogOptions) {
  return overlay.openAsync<string | null>(({ isOpen, close, unmount }) => (
    <PromptOverlay
      {...options}
      isOpen={isOpen}
      onCancel={() => close(null)}
      onConfirm={(value) => close(value)}
      onExit={unmount}
    />
  ));
}

function ConfirmOverlay({
  isOpen,
  title,
  description,
  cancelLabel = '취소',
  confirmLabel = '확인',
  destructive = false,
  onCancel,
  onConfirm,
  onExit,
}: ConfirmDialogOptions & {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onExit: () => void;
}) {
  useUnmountAfterClose(isOpen, onExit);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
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

function PromptOverlay({
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
}: PromptDialogOptions & {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
  onExit: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  useUnmountAfterClose(isOpen, onExit);

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

function useUnmountAfterClose(isOpen: boolean, onExit: () => void) {
  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);
}
