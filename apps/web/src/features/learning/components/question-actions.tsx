'use client';

import { QuestionBookmarkButton } from '@/features/learning/components/question-bookmark-button';
import { QuestionNoteButton } from '@/features/learning/components/question-note-button';
import { QuestionReportButton } from '@/features/learning/components/question-report-button';

export function QuestionActions({
  questionId,
  questionRevisionId,
}: {
  questionId: string;
  questionRevisionId: string;
}) {
  return (
    <>
      <QuestionBookmarkButton questionId={questionId} />
      <QuestionNoteButton questionId={questionId} />
      <QuestionReportButton
        questionId={questionId}
        questionRevisionId={questionRevisionId}
      />
    </>
  );
}
