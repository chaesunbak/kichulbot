import { Button } from '@kichulbot/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kichulbot/ui/components/dialog';
import { Expand } from 'lucide-react';

interface QuestionImagePreviewDialogProps {
  imageUrl: string;
  title: string;
  triggerClassName?: string;
}

export function QuestionImagePreviewDialog({
  imageUrl,
  title,
  triggerClassName,
}: QuestionImagePreviewDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={triggerClassName}
        >
          <Expand className="size-4" aria-hidden="true" />
          크게보기
        </Button>
      </DialogTrigger>
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
