import type { PaperImportDraftQuestion } from '@kichulbot/api-contract/papers';
import type * as z from 'zod';

import type { importPaperSchema, paperSchema } from './schemas';

export type PaperValues = z.infer<typeof paperSchema>;
export type ImportPaperValues = z.infer<typeof importPaperSchema>;

export type ImportPaperQuestionValues = PaperImportDraftQuestion & {
  excluded: boolean;
};
