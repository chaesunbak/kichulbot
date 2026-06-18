import * as z from 'zod';
import { AuthConnectionSchema, UserResponseSchema } from './schema.js';

export const LoginRequestSchema = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자 이하여야 합니다.'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const PasswordResetRequestSchema = z.object({
  email: z.email(),
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetConfirmRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});
export type PasswordResetConfirmRequest = z.infer<
  typeof PasswordResetConfirmRequestSchema
>;

export const PasswordResetIssueResponseSchema = z.object({
  ok: z.literal(true),
});
export type PasswordResetIssueResponse = z.infer<
  typeof PasswordResetIssueResponseSchema
>;

export const PasswordResetConfirmResponseSchema = z.object({
  ok: z.literal(true),
});
export type PasswordResetConfirmResponse = z.infer<
  typeof PasswordResetConfirmResponseSchema
>;

export const RegisterRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  nickname: z.string().max(20).optional(),
  emailVerificationToken: z.string().min(1),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const EmailVerificationRequestSchema = z.object({
  email: z.email(),
});
export type EmailVerificationRequest = z.infer<
  typeof EmailVerificationRequestSchema
>;

export const ConfirmEmailVerificationRequestSchema = z.object({
  email: z.email(),
  code: z.string().regex(/^\d{6}$/),
});
export type ConfirmEmailVerificationRequest = z.infer<
  typeof ConfirmEmailVerificationRequestSchema
>;

export const UpdateMeRequestSchema = z.object({
  nickname: z.string().min(2).max(20),
});
export type UpdateMeRequest = z.infer<typeof UpdateMeRequestSchema>;

export const KakaoOAuthProfileRequestSchema = z.object({
  providerAccountId: z.string().min(1),
});
export type KakaoOAuthProfileRequest = z.infer<
  typeof KakaoOAuthProfileRequestSchema
>;

export const OAuthCodeExchangeRequestSchema = z.object({
  code: z.string().min(1),
});
export type OAuthCodeExchangeRequest = z.infer<
  typeof OAuthCodeExchangeRequestSchema
>;

export const ConfigureEmailLoginRequestSchema = z.object({
  emailVerificationToken: z.string().min(1),
  password: z.string().min(8).max(72),
});
export type ConfigureEmailLoginRequest = z.infer<
  typeof ConfigureEmailLoginRequestSchema
>;

export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  accessToken: z.string().min(1),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const EmailVerificationIssueResponseSchema = z.object({
  ok: z.literal(true),
});
export type EmailVerificationIssueResponse = z.infer<
  typeof EmailVerificationIssueResponseSchema
>;

export const EmailVerificationConfirmResponseSchema = z.object({
  emailVerificationToken: z.string().min(1),
});
export type EmailVerificationConfirmResponse = z.infer<
  typeof EmailVerificationConfirmResponseSchema
>;

export const MeResponseSchema = z.object({
  user: UserResponseSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const UpdateMeResponseSchema = MeResponseSchema;
export type UpdateMeResponse = z.infer<typeof UpdateMeResponseSchema>;

export const DeleteMeResponseSchema = z.object({
  id: z.string(),
});
export type DeleteMeResponse = z.infer<typeof DeleteMeResponseSchema>;

export const AuthConnectionsResponseSchema = z.object({
  connections: z.array(AuthConnectionSchema),
});
export type AuthConnectionsResponse = z.infer<
  typeof AuthConnectionsResponseSchema
>;
