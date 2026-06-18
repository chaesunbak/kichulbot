import type { AccessTokenPayload } from '@kichulbot/api-contract/auth';

import type { UserRole } from '../../infrastructure/database/prisma-client';

export type JwtUser = AccessTokenPayload;

export type RequestUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  role: UserRole;
};
