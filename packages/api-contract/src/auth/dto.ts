import * as z from 'zod';
import { UserResponseSchema } from './schema.js';

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  nickname: z.string().max(30).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const ConvertAnonymousRequestSchema = RegisterRequestSchema;
export type ConvertAnonymousRequest = z.infer<
  typeof ConvertAnonymousRequestSchema
>;

export const AuthResponseSchema = z.object({
  user: UserResponseSchema,
  accessToken: z.string().min(1),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MeResponseSchema = z.object({
  user: UserResponseSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const DeleteMeResponseSchema = z.object({
  id: z.string(),
});
export type DeleteMeResponse = z.infer<typeof DeleteMeResponseSchema>;
