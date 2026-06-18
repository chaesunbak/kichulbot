import * as z from 'zod';
import {
  createStringArrayInputSchema,
  GradingPolicySchema,
  QuestionTypeSchema,
} from '../common.js';

const QuestionStringArraySchema = createStringArrayInputSchema(
  z.string().trim().min(1),
);

export const CreateQuestionRequestSchema = z
  .strictObject({
    paperId: z.string().min(1),
    number: z.coerce.number().int().min(1).max(100),
    type: QuestionTypeSchema.optional(),
    choiceCount: z.coerce.number().int().min(2).max(10).optional(),
    gradingPolicy: GradingPolicySchema.optional(),
    answerChoice: z.coerce.number().int().min(1).max(10).optional(),
    answerText: z.string().trim().min(1).max(2000).optional(),
    explanation: z.string().trim().max(5000).optional(),
    rawText: z.string().trim().max(20000).optional(),
    promptText: z.string().trim().max(20000).optional(),
    passageText: z.string().trim().max(20000).optional(),
    choiceTexts: createStringArrayInputSchema(z.string().trim().max(5000)).pipe(
      z.array(z.string().trim().max(5000)).max(10).optional(),
    ),
    points: z.coerce.number().int().min(1).max(1000).optional(),
    recommendedTimeSeconds: z.coerce.number().int().min(1).max(3600).optional(),
    recommendedTagIds: QuestionStringArraySchema,
    recommendedTagMatches: z
      .array(
        z.strictObject({
          tagId: z.string().min(1),
          keywords: z.array(z.string().trim().min(1)),
        }),
      )
      .optional(),
    tagIds: QuestionStringArraySchema,
  })
  .superRefine(
    ({ type, choiceCount, gradingPolicy, answerChoice, answerText }, ctx) => {
      if ((type ?? 'MULTIPLE_CHOICE') === 'MULTIPLE_CHOICE') {
        if (choiceCount === undefined) {
          ctx.addIssue({
            code: 'custom',
            message: '객관식 문항은 선택지 개수가 필요합니다.',
            path: ['choiceCount'],
          });
        }
        if (
          (gradingPolicy ?? 'EXACT') === 'EXACT' &&
          answerChoice === undefined
        ) {
          ctx.addIssue({
            code: 'custom',
            message: '객관식 문항은 정답 번호가 필요합니다.',
            path: ['answerChoice'],
          });
        }
        return;
      }

      if (!answerText) {
        ctx.addIssue({
          code: 'custom',
          message: '서술형 문항은 모범답안이 필요합니다.',
          path: ['answerText'],
        });
      }
    },
  );
export type CreateQuestionRequest = z.infer<typeof CreateQuestionRequestSchema>;

export const UpdateQuestionRequestSchema = z.strictObject({
  number: z.coerce.number().int().min(1).max(100).optional(),
  type: QuestionTypeSchema.optional(),
  choiceCount: z.coerce.number().int().min(2).max(10).optional(),
  gradingPolicy: GradingPolicySchema.optional(),
  answerChoice: z.coerce.number().int().min(1).max(10).optional(),
  answerText: z.string().trim().min(1).max(2000).optional(),
  explanation: z.string().trim().max(5000).optional(),
  rawText: z.string().trim().max(20000).optional(),
  promptText: z.string().trim().max(20000).optional(),
  passageText: z.string().trim().max(20000).optional(),
  choiceTexts: createStringArrayInputSchema(z.string().trim().max(5000)).pipe(
    z.array(z.string().trim().max(5000)).max(10).optional(),
  ),
  points: z.coerce.number().int().min(1).max(1000).optional(),
  recommendedTimeSeconds: z.coerce.number().int().min(1).max(3600).optional(),
  recommendedTagIds: QuestionStringArraySchema,
  recommendedTagMatches: z
    .array(
      z.strictObject({
        tagId: z.string().min(1),
        keywords: z.array(z.string().trim().min(1)),
      }),
    )
    .optional(),
  tagIds: QuestionStringArraySchema,
});
export type UpdateQuestionRequest = z.infer<typeof UpdateQuestionRequestSchema>;
