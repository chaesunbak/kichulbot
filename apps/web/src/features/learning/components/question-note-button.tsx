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
import { toast } from '@kichulbot/ui/components/sonner';
import { Textarea } from '@kichulbot/ui/components/textarea';
import { Loader2, NotebookPen } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useEffect, useState } from 'react';

import {
  getQuestionNote,
  saveQuestionNote,
} from '@/features/learning/api/client';

export function QuestionNoteButton({ questionId }: { questionId: string }) {
  const [isOpening, setIsOpening] = useState(false);

  const openNote = async () => {
    setIsOpening(true);
    try {
      const note = await getQuestionNote(questionId);
      await overlay.openAsync<void>(({ isOpen, close, unmount }) => (
        <QuestionNoteDialog
          isOpen={isOpen}
          initialContent={note?.content ?? ''}
          questionId={questionId}
          onClose={close}
          onExit={unmount}
        />
      ));
    } catch {
      toast.error('메모를 불러오지 못했습니다.');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isOpening}
      onClick={() => void openNote()}
    >
      {isOpening ? <Loader2 className="animate-spin" /> : <NotebookPen />}
      메모
    </Button>
  );
}

function QuestionNoteDialog({
  isOpen,
  initialContent,
  questionId,
  onClose,
  onExit,
}: {
  isOpen: boolean;
  initialContent: string;
  questionId: string;
  onClose: () => void;
  onExit: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);

  const save = async () => {
    setIsSaving(true);
    try {
      const note = await saveQuestionNote({ questionId, content });
      toast.success(note ? '메모를 저장했습니다.' : '메모를 비웠습니다.');
      onClose();
    } catch {
      toast.error('메모를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>문항 메모</DialogTitle>
          <DialogDescription>
            이 문항에 남긴 메모는 시험, 복습, 북마크에서 함께 보입니다.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className="min-h-48"
          value={content}
          maxLength={5000}
          placeholder="헷갈린 포인트나 다시 볼 내용을 적어두세요."
          onChange={(event) => setContent(event.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" disabled={isSaving} onClick={onClose}>
            취소
          </Button>
          <Button disabled={isSaving} onClick={() => void save()}>
            {isSaving && <Loader2 className="animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
