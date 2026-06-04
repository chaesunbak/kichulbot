import type { z } from 'zod/v4';

import type {
  emailRegisterSchema,
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  updateProfileSchema,
} from './schemas';

export interface AuthUser {
  id: string;
  email: string | null;
  nickname: string | null;
  authType: 'EMAIL' | 'OAUTH';
  linkedProviders: 'KAKAO'[];
  role: 'USER' | 'ADMIN';
}

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type EmailRegisterFormValues = z.infer<typeof emailRegisterSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordResetRequestFormValues = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmFormValues = z.infer<
  typeof passwordResetConfirmSchema
>;
