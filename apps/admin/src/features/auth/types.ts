import type { UserResponse } from '@kichulbot/api-contract/auth';
import type * as z from 'zod';

import type { loginSchema } from './schemas';

export type LoginValues = z.infer<typeof loginSchema>;

export type AuthUser = Pick<
  UserResponse,
  'id' | 'email' | 'nickname' | 'authType' | 'role'
>;
