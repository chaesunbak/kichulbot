import type { PaperImportDraftQuestion } from '@kichulbot/api-contract/papers';
import * as z from 'zod';

import { paperSchema } from './schemas';

export type PaperValues = z.infer<typeof paperSchema>;

export type ImportPaperValues = {
  title: string;
  year: number;
  month?: number;
  grade?: number;
  round?: number;
  examId: string;
  questionCount: number;
  isPublished: boolean;
  layout: string;
  variant: string;
};

export type ImportPaperQuestionValues = PaperImportDraftQuestion & {
  excluded: boolean;
};
