import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { paperKeys } from '@/features/papers/queries';

import { createQuestion, deleteQuestion, updateQuestion } from './api';
import type { QuestionValues } from './schemas';

export function useSaveQuestionMutation({
  token,
  paperId,
  editingQuestionId,
  image,
  onSuccess,
}: {
  token: string;
  paperId: string;
  editingQuestionId: string | null;
  image: File | null;
  onSuccess: (question: AdminPaperQuestionResponse) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: QuestionValues) => {
      if (editingQuestionId)
        return updateQuestion(token, editingQuestionId, {
          ...values,
          image: image ?? undefined,
        });
      if (!image) throw new Error('문제 이미지를 업로드해 주세요.');
      return createQuestion(token, { ...values, paperId, image });
    },
    onSuccess: ({ question }) => {
      queryClient.invalidateQueries({ queryKey: paperKeys.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: paperKeys.lists() });
      onSuccess(question);
      toast.success(
        editingQuestionId
          ? '문항을 수정했습니다.'
          : `${question.number}번 문항을 등록했습니다.`,
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '문항 저장에 실패했습니다.',
      ),
  });
}

export function useDeleteQuestionMutation({
  token,
  paperId,
  onSuccess,
}: {
  token: string;
  paperId: string;
  onSuccess: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(token, questionId),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: paperKeys.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: paperKeys.lists() });
      onSuccess(id);
      toast.success('문항을 삭제했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '문항 삭제에 실패했습니다.',
      ),
  });
}
