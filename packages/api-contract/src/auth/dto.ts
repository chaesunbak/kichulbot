import * as z from 'zod';
import {
  AuthMethodSchema,
  IsoDateStringSchema,
  OAuthProviderSchema,
  SignupMethodSchema,
  UserRoleSchema,
} from '../common.js';

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email().nullable(),
  nickname: z.string().nullable(),
  signupMethod: SignupMethodSchema,
  authMethods: z.array(AuthMethodSchema),
  linkedProviders: z.array(OAuthProviderSchema),
  role: UserRoleSchema,
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const AuthConnectionSchema = z.object({
  provider: OAuthProviderSchema,
  lastLoginAt: IsoDateStringSchema.nullable(),
  createdAt: IsoDateStringSchema,
});
export type AuthConnection = z.infer<typeof AuthConnectionSchema>;
