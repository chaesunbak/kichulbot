import * as z from 'zod';

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상 입력해주세요')
    .max(20, '닉네임은 20자 이하로 입력해주세요'),
});

export const loginSchema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다'),
  password: z.string().min(8, '비밀번호를 입력해주세요').max(72),
});

export const emailRegisterSchema = z
  .object({
    email: z.string().email('이메일 형식이 올바르지 않습니다'),
    code: z.string().regex(/^\d{6}$/, '인증번호 6자리를 입력해주세요'),
    nickname: z
      .string()
      .max(20, '닉네임은 20자 이하로 입력해주세요')
      .optional(),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상 입력해주세요')
      .max(72, '비밀번호는 72자 이하로 입력해주세요'),
    passwordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해주세요'),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다',
  });

export const passwordResetRequestSchema = z.object({
  email: z.string().email('이메일 형식이 올바르지 않습니다'),
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, '재설정 토큰이 필요합니다'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상 입력해주세요')
      .max(72, '비밀번호는 72자 이하로 입력해주세요'),
    passwordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해주세요'),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다',
  });
