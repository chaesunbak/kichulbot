import * as z from 'zod';
import {
  IsoDateStringSchema,
  OAuthProviderSchema,
  UserAuthTypeSchema,
  UserRoleSchema,
} from '../common.js';

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.email().nullable(),
  nickname: z.string().nullable(),
  authType: UserAuthTypeSchema,
  linkedProviders: z.array(OAuthProviderSchema),
  role: UserRoleSchema,
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const AuthConnectionSchema = z.object({
  provider: OAuthProviderSchema,
  providerEmail: z.email().nullable(),
  providerNickname: z.string().nullable(),
  lastLoginAt: IsoDateStringSchema.nullable(),
  createdAt: IsoDateStringSchema,
});
export type AuthConnection = z.infer<typeof AuthConnectionSchema>;

export const AccessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  role: UserRoleSchema,
  authType: UserAuthTypeSchema,
  tokenVersion: z.number().int().nonnegative(),
});
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;
