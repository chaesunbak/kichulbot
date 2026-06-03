import type { UserResponse } from '@kichulbot/api-contract/auth';
import { UserResponseSchema } from '@kichulbot/api-contract/auth';
import type {
  OAuthAccount,
  User,
} from '../../infrastructure/database/prisma-client';

export type SerializableUser = User & {
  oauthAccounts?: Pick<OAuthAccount, 'provider'>[];
};

export function serializeUser(user: SerializableUser): UserResponse {
  return UserResponseSchema.parse({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    authType: user.authType,
    linkedProviders:
      user.oauthAccounts?.map((oauthAccount) => oauthAccount.provider) ?? [],
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}
