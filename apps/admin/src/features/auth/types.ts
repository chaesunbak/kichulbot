import type * as z from 'zod';

import type { User } from '@/shared/types';

import type { loginSchema } from './schemas';

export type LoginValues = z.infer<typeof loginSchema>;

export type AuthUser = Pick<
  User,
  'id' | 'email' | 'nickname' | 'signupMethod' | 'authMethods' | 'role'
>;
