'use client';

import { QuestionBookmarkButton } from '@/features/learning/components/question-bookmark-button';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import { QuestionReportButton } from '@/features/learning/components/question-report-button';

export function QuestionActions({
  questionId,
  questionRevisionId,
  showPersonalActions = true,
  showReportAction = true,
  isAuthenticated = true,
  compact = false,
}: {
  questionId: string;
  questionRevisionId: string;
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
