'use client';

import { QuestionBookmarkButton } from '@/features/learning/components/question-bookmark-button';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import { QuestionReportButton } from '@/features/learning/components/question-report-button';
import { QuestionShareButton } from '@/features/learning/components/question-share-button';

export function QuestionActions({
  questionId,
  questionRevisionId,
  shareHref,
  showPersonalActions = true,
  showReportAction = true,
  isAuthenticated = true,
  compact = false,
}: {
  questionId: string;
  questionRevisionId: string;
  shareHref?: string;
  showPersonalActions?: boolean;
  showReportAction?: boolean;
  isAuthenticated?: boolean;
  compact?: boolean;
}) {
  return (
    <>
      {showPersonalActions && (
        <>
          <QuestionBookmarkButton
            questionId={questionId}
            isAuthenticated={isAuthenticated}
            compact={compact}
          />
          <QuestionNoteButton
            questionId={questionId}
            isAuthenticated={isAuthenticated}
            compact={compact}
          />
        </>
      )}
      {shareHref && <QuestionShareButton href={shareHref} compact={compact} />}
      {showReportAction && (
        <QuestionReportButton
          questionId={questionId}
          questionRevisionId={questionRevisionId}
          isAuthenticated={isAuthenticated}
          compact={compact}
        />
      )}
    </>
  );
}
