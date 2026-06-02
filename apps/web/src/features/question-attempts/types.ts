export type QuestionAttemptOutcome = 'CORRECT' | 'INCORRECT' | 'OMITTED';

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
}
