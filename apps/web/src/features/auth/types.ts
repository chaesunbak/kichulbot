import type * as z from 'zod';

import type {
  emailRegisterSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  updateProfileSchema,
} from './schemas';

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type EmailRegisterFormValues = z.infer<typeof emailRegisterSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordResetRequestFormValues = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmFormValues = z.infer<
  typeof passwordResetConfirmSchema
>;
