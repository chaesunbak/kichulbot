import type { Paper } from '@/features/papers/types';

export interface ExamCategory {
  id: string;
  name: string;
}

export type Category = ExamCategory;

export interface Exam {
  id: string;
  name: string;
  slug: string;
  categories: ExamCategory[];
  usesMonth: boolean;
  usesGrade: boolean;
  usesRound: boolean;
  isMockExamAvailable: boolean;
}

export interface ExamPaperOverview {
  exam: Exam;
  paperCount: number;
  papers: Array<Paper & { registeredQuestionCount: number }>;
}
