export type QuestionAttemptOutcome = 'CORRECT' | 'INCORRECT' | 'OMITTED';

export type TagSelectionMode = 'SINGLE' | 'MULTIPLE';

export interface QuestionAttemptTagGroup {
  id: string;
  examId: string;
  name: string;
  selectionMode: TagSelectionMode;
  sortOrder: number;
  isActive: boolean;
}

export interface QuestionAttemptTag {
  id: string;
  name: string;
  kind: 'OFFICIAL';
  tagGroup?: QuestionAttemptTagGroup | null;
}

export interface QuestionAttempt {
  id: string;
  sessionItemId: string | null;
  questionRevisionId: string;
  questionId: string;
  answerChoice: number | null;
  answerText: string | null;
  outcome: QuestionAttemptOutcome;
  spentMilliseconds: number;
  gradedAt: string;
  tags?: QuestionAttemptTag[];
}
