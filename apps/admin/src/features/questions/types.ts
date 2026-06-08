import type * as z from 'zod';

import type { questionSchema } from './schemas';

export type QuestionValues = z.infer<typeof questionSchema>;
