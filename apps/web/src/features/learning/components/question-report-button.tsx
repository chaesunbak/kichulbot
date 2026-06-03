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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { toast } from '@kichulbot/ui/components/ui/sonner';
import { Textarea } from '@kichulbot/ui/components/ui/textarea';
import { Flag, Loader2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useEffect, useState } from 'react';

import { createQuestionReport } from '@/features/learning/api/client';
import type { QuestionReportCategory } from '@/features/learning/types';

const reportCategories = [
  { value: 'QUESTION_ERROR', label: '문제 오류' },
  { value: 'IMAGE_ERROR', label: '그림 오류' },
  { value: 'CHOICE_ERROR', label: '보기 오류' },
  { value: 'ANSWER_ERROR', label: '정답 오류' },
  { value: 'EXPLANATION_ERROR', label: '해설 오류' },
  { value: 'CATEGORY_ERROR', label: '분류 오류' },
  { value: 'OTHER', label: '기타' },
] satisfies Array<{ value: QuestionReportCategory; label: string }>;

export function QuestionReportButton({
  questionId,
  questionRevisionId,
  isAuthenticated = true,
}: {
  questionId: string;
  questionRevisionId: string;
  isAuthenticated?: boolean;
}) {
  const [isOpening, setIsOpening] = useState(false);

  const openReport = async () => {
    setIsOpening(true);
    try {
      await overlay.openAsync<void>(({ isOpen, close, unmount }) => (
        <QuestionReportDialog
          isOpen={isOpen}
          questionId={questionId}
          questionRevisionId={questionRevisionId}
          isAuthenticated={isAuthenticated}
          onClose={close}
          onExit={unmount}
        />
      ));
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isOpening}
      onClick={() => void openReport()}
    >
      {isOpening ? <Loader2 className="animate-spin" /> : <Flag />}
      신고
    </Button>
  );
}

function QuestionReportDialog({
  isOpen,
  questionId,
  questionRevisionId,
  isAuthenticated,
  onClose,
  onExit,
}: {
  isOpen: boolean;
  questionId: string;
  questionRevisionId: string;
  isAuthenticated: boolean;
  onClose: () => void;
  onExit: () => void;
}) {
  const [category, setCategory] =
    useState<QuestionReportCategory>('QUESTION_ERROR');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedContent = content.trim();

  useEffect(() => {
    if (isOpen) return;

    const timeoutId = window.setTimeout(onExit, 120);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, onExit]);

  const submit = async () => {
    if (!trimmedContent) {
      toast.error('신고 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuestionReport({
        questionId,
        questionRevisionId,
        category,
        content: trimmedContent,
        isAuthenticated,
      });
      toast.success('문제 신고를 접수했습니다.');
      onClose();
    } catch {
      toast.error('문제 신고를 접수하지 못했습니다.');
    } finally {
      setIsSubmitting(false);
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
          <DialogTitle>문제 신고</DialogTitle>
          <DialogDescription>
            문제를 확인할 수 있도록 오류 유형과 내용을 적어주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-zinc-900">
            신고 분류
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as QuestionReportCategory)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportCategories.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-900">
            신고 내용
            <Textarea
              className="min-h-40"
              value={content}
              maxLength={5000}
              placeholder="어떤 부분을 확인해야 하는지 알려주세요."
              onChange={(event) => setContent(event.target.value)}
            />
          </label>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !trimmedContent}
            onClick={() => void submit()}
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            접수
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
