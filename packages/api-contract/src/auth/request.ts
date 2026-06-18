import * as z from 'zod';

export const LoginRequestSchema = z.strictObject({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자 이하여야 합니다.'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const PasswordResetRequestSchema = z.strictObject({
  email: z.email(),
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetConfirmRequestSchema = z.strictObject({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});
export type PasswordResetConfirmRequest = z.infer<
  typeof PasswordResetConfirmRequestSchema
>;

export const RegisterRequestSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(72),
  nickname: z.string().max(20).optional(),
  emailVerificationToken: z.string().min(1),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const EmailVerificationRequestSchema = z.strictObject({
  email: z.email(),
});
export type EmailVerificationRequest = z.infer<
  typeof EmailVerificationRequestSchema
>;

export const ConfirmEmailVerificationRequestSchema = z.strictObject({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/),
});
export type ConfirmEmailVerificationRequest = z.infer<
  typeof ConfirmEmailVerificationRequestSchema
>;

export const UpdateMeRequestSchema = z.strictObject({
  nickname: z.string().min(2).max(20),
});
export type UpdateMeRequest = z.infer<typeof UpdateMeRequestSchema>;

export const KakaoOAuthProfileRequestSchema = z.strictObject({
  providerAccountId: z.string().min(1),
});
export type KakaoOAuthProfileRequest = z.infer<
  typeof KakaoOAuthProfileRequestSchema
>;

export const OAuthCodeExchangeRequestSchema = z.strictObject({
  code: z.string().min(1),
});
export type OAuthCodeExchangeRequest = z.infer<
  typeof OAuthCodeExchangeRequestSchema
>;

export const ConfigureEmailLoginRequestSchema = z.strictObject({
  emailVerificationToken: z.string().min(1),
  password: z.string().min(8).max(72),
});
export type ConfigureEmailLoginRequest = z.infer<
  typeof ConfigureEmailLoginRequestSchema
>;
