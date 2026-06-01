import {
  DeleteQuestionResponseSchema,
  QuestionMutationResponseSchema,
} from '@kichulbot/api-contract/questions';
import type { QuestionType } from '@kichulbot/api-contract';
import { apiRequest } from '@/shared/api/api-client';

interface QuestionInput {
  number: number;
  type: QuestionType;
  choiceCount?: number;
  answerChoice?: number;
  answerText?: string;
  explanation?: string;
  recommendedTimeSeconds?: number;
  tagIds: string[];
  image?: File;
}

export interface CreateQuestionInput extends QuestionInput {
  paperId: string;
  image: File;
}

export type UpdateQuestionInput = QuestionInput;

function toQuestionFormData(
  input: CreateQuestionInput | UpdateQuestionInput,
): FormData {
  const formData = new FormData();
  if ('paperId' in input) {
    formData.append('paperId', input.paperId);
  }
  formData.append('number', String(input.number));
  formData.append('type', input.type);
  if (input.choiceCount !== undefined) {
    formData.append('choiceCount', String(input.choiceCount));
  }
  if (input.answerChoice !== undefined) {
    formData.append('answerChoice', String(input.answerChoice));
  }
  if (input.answerText !== undefined) {
    formData.append('answerText', input.answerText);
  }
  if (input.explanation !== undefined) {
    formData.append('explanation', input.explanation);
  }
  if (input.recommendedTimeSeconds !== undefined) {
    formData.append(
      'recommendedTimeSeconds',
      String(input.recommendedTimeSeconds),
    );
  }
  input.tagIds.forEach((tagId) => formData.append('tagIds', tagId));
  if (input.image) {
    formData.append('image', input.image);
  }
  return formData;
}

export async function createQuestion(
  token: string,
  input: CreateQuestionInput,
) {
  return apiRequest('/questions', QuestionMutationResponseSchema.parse, {
    method: 'POST',
    token,
    body: toQuestionFormData(input),
  });
}

export async function updateQuestion(
  token: string,
  questionId: string,
  input: UpdateQuestionInput,
) {
  return apiRequest(
    `/questions/${questionId}`,
    QuestionMutationResponseSchema.parse,
    {
      method: 'PATCH',
      token,
      body: toQuestionFormData(input),
    },
  );
}

export async function deleteQuestion(token: string, questionId: string) {
  return apiRequest(
    `/questions/${questionId}`,
    DeleteQuestionResponseSchema.parse,
    {
      method: 'DELETE',
      token,
    },
  );
}
