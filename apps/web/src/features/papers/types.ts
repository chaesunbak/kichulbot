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
