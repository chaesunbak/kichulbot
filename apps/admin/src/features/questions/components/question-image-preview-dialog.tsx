import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kichulbot/ui/components/ui/dialog';
import * as React from 'react';

interface QuestionImagePreviewDialogProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onExit: () => void;
  title: string;
}

export function QuestionImagePreviewDialog({
  imageUrl,
  isOpen,
  onClose,
  onExit,
  title,
}: QuestionImagePreviewDialogProps) {
  React.useEffect(() => {
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
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            원본 비율에 가깝게 크게 표시합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-md border bg-muted/20 p-2">
          <img
            className="max-h-[75vh] w-full object-contain"
            src={imageUrl}
            alt={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
