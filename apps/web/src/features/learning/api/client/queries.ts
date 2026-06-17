import type { QuestionNote } from '@/features/learning/types';
import { clientApi } from '@/shared/api/client';

export async function getQuestionNote(
  questionId: string,
): Promise<QuestionNote | null> {
  const res = await clientApi.get<{ data: { note: QuestionNote | null } }>(
    `/api/me/question-notes/${questionId}`,
  );
  return res.data.note;
}
