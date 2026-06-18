import * as z from 'zod';

export const questionSchema = z
  .object({
    type: z.enum(['MULTIPLE_CHOICE', 'WRITTEN']),
    number: z.number().int().min(1).max(100),
    choiceCount: z.number().int().min(2).max(10).nullable(),
    gradingPolicy: z.enum(['EXACT', 'ANY_CHOICE']),
    answerChoice: z.number().int().min(1).max(10).nullable(),
    answerText: z.string().optional(),
    explanation: z.string().optional(),
    points: z.number().int().min(1).max(100),
    recommendedTimeSeconds: z.number().int().min(1).nullable(),
    recommendedTagIds: z.array(z.string()),
    tagIds: z.array(z.string()),
  })
  .superRefine(
    ({ type, choiceCount, gradingPolicy, answerChoice, answerText }, ctx) => {
      if (type === 'MULTIPLE_CHOICE') {
        if (choiceCount === null) {
          ctx.addIssue({
            code: 'custom',
            message: '선택지 개수를 입력해 주세요.',
            path: ['choiceCount'],
          });
        }
        if (gradingPolicy === 'EXACT' && answerChoice === null) {
          ctx.addIssue({
            code: 'custom',
            message: '정답을 입력해 주세요.',
            path: ['answerChoice'],
          });
        }
        if (
          gradingPolicy === 'EXACT' &&
          choiceCount !== null &&
          answerChoice !== null &&
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
    },
  );
