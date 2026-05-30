import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email('관리자 이메일을 입력해 주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(72, '비밀번호는 72자 이하여야 합니다.'),
});

export const paperSchema = z.object({
  title: z
    .string()
    .min(2, '문제지 제목을 입력해 주세요.')
    .max(100, '문제지 제목은 100자 이하여야 합니다.'),
  year: z
    .number()
    .int('연도는 정수로 입력해 주세요.')
    .min(1994, '1994년 이후 연도를 입력해 주세요.')
    .max(2100, '2100년 이하 연도를 입력해 주세요.'),
  examId: z.string().min(1, '시험을 선택해 주세요.'),
  subjectId: z.string().min(1, '과목을 선택해 주세요.'),
  questionCount: z
    .number()
    .int('문항 수는 정수로 입력해 주세요.')
    .min(1, '문항 수는 1개 이상이어야 합니다.')
    .max(100, '문항 수는 100개 이하여야 합니다.'),
  isPublished: z.enum(['false', 'true']),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type PaperValues = z.infer<typeof paperSchema>;
