import { Button } from '@kichulbot/ui/components/ui/button';
import { Trash2 } from 'lucide-react';

import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import type { BookmarkList } from '@/features/learning/types';

type BookmarkListQuestion = BookmarkList['questions'][number];

type BookmarkListItemProps = {
  disabled: boolean;
  question: BookmarkListQuestion;
  onRemove: (questionId: string) => void;
};

export function BookmarkListItem({
  disabled,
  question,
  onRemove,
}: BookmarkListItemProps) {
  return (
    <li className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-foreground">
            {question.paper.title} {question.number}번
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {question.paper.examName} · {question.paper.year}학년도
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuestionNoteButton questionId={question.id} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onRemove(question.id)}
          >
            <Trash2 />
            제거
          </Button>
        </div>
      </div>
      {question.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt={`${question.paper.title} ${question.number}번 문제`}
          loading="lazy"
          decoding="async"
          className="mt-4 max-h-140 w-full rounded-lg object-contain"
        />
      ) : (
        <p
          className="
            mt-4 rounded-lg bg-muted px-4 py-10 text-center text-sm
            text-muted-foreground
          "
        >
          문제 이미지가 없습니다.
        </p>
      )}
    </li>
  );
}
