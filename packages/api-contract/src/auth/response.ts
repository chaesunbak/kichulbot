import * as z from 'zod';
import { AuthConnectionSchema, UserResponseSchema } from './dto.js';

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
