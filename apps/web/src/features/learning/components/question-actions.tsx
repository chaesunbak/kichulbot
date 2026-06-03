'use client';

import { QuestionBookmarkButton } from '@/features/learning/components/question-bookmark-button';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import { QuestionReportButton } from '@/features/learning/components/question-report-button';

export function QuestionActions({
  questionId,
  questionRevisionId,
  showPersonalActions = true,
  isAuthenticated = true,
}: {
  questionId: string;
  questionRevisionId: string;
  showPersonalActions?: boolean;
  isAuthenticated?: boolean;
}) {
  return (
    <>
      {showPersonalActions && (
        <>
          <QuestionBookmarkButton
            questionId={questionId}
            isAuthenticated={isAuthenticated}
          />
          <QuestionNoteButton
            questionId={questionId}
            isAuthenticated={isAuthenticated}
          />
        </>
      )}
      <QuestionReportButton
        questionId={questionId}
        questionRevisionId={questionRevisionId}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
