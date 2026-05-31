import * as z from 'zod';

export const questionSchema = z
  .object({
    type: z.enum(['MULTIPLE_CHOICE', 'WRITTEN']),
    number: z.number().int().min(1).max(100),
    choiceCount: z.number().int().min(2).max(10).optional(),
    answerChoice: z.number().int().min(1).max(10).optional(),
    answerText: z.string().max(2000).optional(),
    explanation: z.string().max(5000).optional(),
    recommendedTimeSeconds: z.number().int().min(1).max(3600).optional(),
    tagIds: z.array(z.string()),
  })
  .superRefine(({ type, choiceCount, answerChoice, answerText }, ctx) => {
    if (type === 'MULTIPLE_CHOICE') {
      if (choiceCount === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '선택지 개수를 입력해 주세요.',
          path: ['choiceCount'],
        });
      }
      if (answerChoice === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: '정답을 입력해 주세요.',
          path: ['answerChoice'],
        });
      }
      if (
        choiceCount !== undefined &&
        answerChoice !== undefined &&
        answerChoice > choiceCount
      ) {
        ctx.addIssue({
          code: 'custom',
          message: '정답은 선택지 개수를 넘을 수 없습니다.',
          path: ['answerChoice'],
        });
      }
    } else if (!answerText?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: '모범답안을 입력해 주세요.',
        path: ['answerText'],
      });
    }
  });

export type QuestionValues = z.infer<typeof questionSchema>;
