import type {
  UserAuthType,
  UserRole,
} from '../../infrastructure/database/prisma-client';

export type JwtUser = {
  sub: string;
  role: UserRole;
  authType: UserAuthType;
};

export type RequestUser = {
  id: string;
  email: string | null;
  nickname: string | null;
  authType: UserAuthType;
  role: UserRole;
};
