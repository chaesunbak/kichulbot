import * as z from 'zod';

import { loginSchema, registerSchema } from './schemas';

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
