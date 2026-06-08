import type * as z from 'zod';

import type { tagFormSchema, tagGroupFormSchema } from './schemas';

export type TagForm = z.infer<typeof tagFormSchema>;
export type TagGroupForm = z.infer<typeof tagGroupFormSchema>;
