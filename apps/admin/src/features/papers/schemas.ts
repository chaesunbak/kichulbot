import * as z from 'zod';

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
  month: z.number().int().min(1).max(12).optional(),
  grade: z.number().int().min(1).max(3).optional(),
  round: z.number().int().min(1).optional(),
  examId: z.string().min(1, '시험을 선택해 주세요.'),
  questionCount: z
    .number()
    .int('문항 수는 정수로 입력해 주세요.')
    .min(1, '문항 수는 1개 이상이어야 합니다.')
    .max(100, '문항 수는 100개 이하여야 합니다.'),
  isPublished: z.enum(['false', 'true']),
});

export type PaperValues = z.infer<typeof paperSchema>;
