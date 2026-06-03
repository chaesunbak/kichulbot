export interface ExamCategory {
  id: string;
  name: string;
}

export type Category = ExamCategory;

export interface Exam {
  id: string;
  name: string;
  categories: ExamCategory[];
  usesMonth: boolean;
  usesGrade: boolean;
  usesRound: boolean;
}
