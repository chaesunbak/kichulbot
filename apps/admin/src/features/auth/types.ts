import type * as z from 'zod';

import type { loginSchema } from './schemas';

export type LoginValues = z.infer<typeof loginSchema>;
