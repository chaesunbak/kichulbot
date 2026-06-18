import type {
  ExamMutationResponse,
  PublicListExamsResponse,
} from '@kichulbot/api-contract/taxonomy';

import type {
  Category,
  Exam,
  ExamCategory,
  MockExamBlueprintItem,
} from '../../infrastructure/database/prisma-client';
import type { CreateExamDto } from './dto/create-exam.dto';

export type AdminExamItem = ExamMutationResponse['exam'];
export type ExamItem = PublicListExamsResponse['exams'][number];

export type ExamRecord = Exam & {
  categories: Array<ExamCategory & { category: Category }>;
  mockExamBlueprintItems?: MockExamBlueprintItem[];
  sessions?: Array<{ _count: { papers: number } }>;
};

export type MockExamBlueprintItemInput = NonNullable<
  CreateExamDto['mockExamBlueprintItems']
>[number];

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
