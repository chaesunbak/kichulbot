import { LoginRequestSchema } from '@kichulbot/api-contract/auth';
import * as z from 'zod';

export const loginSchema = LoginRequestSchema.extend({
  email: z.email('관리자 이메일을 입력해 주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자 이하여야 합니다.'),
});
