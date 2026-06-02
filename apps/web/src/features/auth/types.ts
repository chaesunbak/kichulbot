import * as z from 'zod';

import { loginSchema, registerSchema, updateProfileSchema } from './schemas';

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
