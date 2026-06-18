import type { z } from 'zod/v4';

import type {
  emailLoginSettingsSchema,
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
  signupMethod: 'EMAIL' | 'KAKAO';
  authMethods: Array<'EMAIL' | 'KAKAO'>;
  linkedProviders: 'KAKAO'[];
  role: 'USER' | 'ADMIN';
}

export interface AuthSession {
  user: AuthUser;
}

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type EmailRegisterFormValues = z.infer<typeof emailRegisterSchema>;
export type EmailLoginSettingsFormValues = z.infer<
  typeof emailLoginSettingsSchema
>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type PasswordResetRequestFormValues = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmFormValues = z.infer<
  typeof passwordResetConfirmSchema
>;
