import type { AccessTokenPayload } from '@kichulbot/api-contract/auth';

import type {
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';

export type JwtUser = AccessTokenPayload;

export type RequestUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  authType: UserAuthType;
  role: UserRole;
};
