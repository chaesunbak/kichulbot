import type * as z from 'zod';

import type { categoryFormSchema, examFormSchema } from './schemas';

export type CategoryForm = z.infer<typeof categoryFormSchema>;
export type ExamForm = z.infer<typeof examFormSchema>;
