import type { UserResponse } from '@kichulbot/api-contract/auth';
import { UserResponseSchema } from '@kichulbot/api-contract/auth';

import type {
  OAuthAccount,
  User,
} from '../../infrastructure/database/prisma-client';
import { OAuthProvider } from '../../infrastructure/database/prisma-client';

export type SerializableUser = User & {
  oauthAccounts?: Pick<OAuthAccount, 'provider'>[];
};

export function serializeUser(user: SerializableUser): UserResponse {
  return UserResponseSchema.parse({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    signupMethod: user.signupMethod,
    authMethods: getAuthMethods(user),
    linkedProviders:
      user.oauthAccounts?.map((oauthAccount) => oauthAccount.provider) ?? [],
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}

export function getAuthMethods(
  user: SerializableUser,
): Array<'EMAIL' | 'KAKAO'> {
  const methods: Array<'EMAIL' | 'KAKAO'> = [];
  if (user.email && user.passwordHash) {
    methods.push('EMAIL');
  }
  if (
    user.oauthAccounts?.some(
      (oauthAccount) => oauthAccount.provider === OAuthProvider.KAKAO,
    )
  ) {
    methods.push('KAKAO');
  }
  return methods;
}
