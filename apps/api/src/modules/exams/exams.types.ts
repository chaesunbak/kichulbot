export interface PublicPaperPreviewRow {
  id: string;
  title: string;
  year: number;
  month: number | null;
  grade: number | null;
  round: number | null;
  questionCount: number;
  registeredQuestionCount: number;
}

export interface PublicExamPaperOverviewRow {
  id: string;
  name: string;
  slug: string;
  categories: Array<{ id: string; name: string }>;
  usesMonth: boolean;
  usesGrade: boolean;
  usesRound: boolean;
  isMockExamAvailable: boolean;
  paperCount: number;
  papers: PublicPaperPreviewRow[];
}
