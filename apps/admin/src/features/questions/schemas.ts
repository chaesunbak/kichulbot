import { CreateQuestionRequestSchema } from '@kichulbot/api-contract/questions';
import * as z from 'zod';

const questionRequestShape = CreateQuestionRequestSchema.shape;

export const questionSchema = z
  .object({
    type: questionRequestShape.type.unwrap(),
    number: questionRequestShape.number,
    choiceCount: questionRequestShape.choiceCount.unwrap().nullable(),
    gradingPolicy: questionRequestShape.gradingPolicy.unwrap(),
    answerChoice: questionRequestShape.answerChoice.unwrap().nullable(),
    answerText: questionRequestShape.answerText.or(z.literal('')),
    explanation: questionRequestShape.explanation.or(z.literal('')),
    points: questionRequestShape.points.unwrap(),
    recommendedTimeSeconds: questionRequestShape.recommendedTimeSeconds
      .unwrap()
      .nullable(),
    recommendedTagIds: questionRequestShape.recommendedTagIds.unwrap(),
    tagIds: questionRequestShape.tagIds.unwrap(),
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
