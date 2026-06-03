import type { UserResponse } from '@kichulbot/api-contract/auth';
import { UserResponseSchema } from '@kichulbot/api-contract/auth';
import type { User } from '../../infrastructure/database/prisma-client';

export function serializeUser(user: User): UserResponse {
  return UserResponseSchema.parse({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    authType: user.authType,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}
