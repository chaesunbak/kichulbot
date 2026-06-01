import type { Paper } from './papers';

export interface LibraryPaper {
  paper: Paper;
  createdAt: string;
}

export interface Bookshelf {
  id: string;
  name: string;
  papers: LibraryPaper[];
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkListSummary {
  id: string;
  name: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkedQuestion {
  id: string;
  number: number;
  imageUrl: string | null;
  paper: {
    id: string;
    title: string;
    year: number;
    examName: string;
    subjectName: string;
  };
  createdAt: string;
}

export interface BookmarkList extends BookmarkListSummary {
  questions: BookmarkedQuestion[];
}

export interface SolveQuestion {
  id: string;
  number: number;
  type: 'MULTIPLE_CHOICE' | 'WRITTEN';
  imageUrl: string | null;
  choiceCount: number | null;
  recommendedTimeSeconds: number | null;
  result: QuestionResult | null;
}

export interface QuestionResult {
  answerChoice: number | null;
  answerText: string | null;
  explanation: string | null;
  isCorrect: boolean | null;
}

export interface Answer {
  questionId: string;
  answerChoice: number | null;
  answerText: string | null;
  isCorrect: boolean | null;
  spentMilliseconds: number;
  updatedAt: string;
}

export interface AnswerSessionResult {
  score: number;
  totalCount: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  totalSpentMilliseconds: number;
}

export interface AnswerSession {
  id: string;
  mode: 'ONE_BY_ONE' | 'EXAM';
  paper: Paper & { questions: SolveQuestion[] };
  answers: Answer[];
  result: AnswerSessionResult | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerSessionLog {
  id: string;
  mode: 'ONE_BY_ONE' | 'EXAM';
  paper: Paper;
  result: AnswerSessionResult;
  submittedAt: string;
  createdAt: string;
}

export interface DailyWrongQuestionSet {
  id: string;
  title: string;
  studyDate: string;
  questionCount: number;
  questions: {
    id: string;
    number: number;
    imageUrl: string | null;
    sourceOutcome: 'INCORRECT' | 'OMITTED';
    paper: {
      id: string;
      title: string;
      year: number;
      examName: string;
      subjectName: string;
    };
  }[];
  generatedAt: string;
}
