export interface Taxonomy {
  id: string;
  name: string;
}

export interface Paper {
  id: string;
  title: string;
  year: number;
  month: number | null;
  grade: number | null;
  round: number | null;
  questionCount: number;
  isInLibrary: boolean;
  exam: Taxonomy;
}

export interface PaperQuestion {
  id: string;
  questionRevisionId: string;
  number: number;
  type: 'MULTIPLE_CHOICE' | 'WRITTEN';
  imageUrl: string;
  imageCacheKey: string;
  choiceCount: number | null;
  answerChoice: number | null;
  answerText: string | null;
  explanation: string | null;
  points: number;
  recommendedTimeSeconds: number | null;
  isBookmarked: boolean;
}
