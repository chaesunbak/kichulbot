import * as z from 'zod';
import {
  IsoDateStringSchema,
  UserAuthTypeSchema,
  UserRoleSchema,
} from '../common.js';

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  nickname: z.string().nullable(),
  authType: UserAuthTypeSchema,
  role: UserRoleSchema,
  createdAt: IsoDateStringSchema,
  updatedAt: IsoDateStringSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;
