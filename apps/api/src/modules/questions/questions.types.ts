import type { QuestionMutationResponse } from '@kichulbot/api-contract/questions';

import type { GradingPolicy } from '../../infrastructure/database/prisma-client';
import type { QuestionsRepository } from './questions.repository';

export type AdminQuestionItem = QuestionMutationResponse['question'];

export type QuestionRecord = NonNullable<
  Awaited<ReturnType<QuestionsRepository['findById']>>
>;

export type QuestionAnswerDataInput = {
  choiceCount?: number;
  gradingPolicy?: GradingPolicy;
  answerChoice?: number;
  answerText?: string;
};

export type QuestionImagePathPaper = NonNullable<
  Awaited<ReturnType<QuestionsRepository['findPaper']>>
>;
