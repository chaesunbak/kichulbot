import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createCategory, createExam, updateCategory, updateExam } from './api';
import { referenceDataKeys } from './queries';

export interface CategoryForm {
  name: string;
}

export interface ExamForm extends CategoryForm {
  categoryIds: string[];
  usesMonth: boolean;
  usesGrade: boolean;
  usesRound: boolean;
}

export function useSaveCategoryMutation(
  token: string,
  editingCategoryId: string | null,
  onSuccess: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: CategoryForm) => {
      const input = { name: form.name.trim() };
      if (!input.name) {
        throw new Error('분류 이름을 입력해 주세요.');
      }
      return editingCategoryId
        ? updateCategory(token, editingCategoryId, input)
        : createCategory(token, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceDataKeys.all });
      onSuccess();
      toast.success(
        editingCategoryId ? '분류를 수정했습니다.' : '분류를 추가했습니다.',
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '분류 저장에 실패했습니다.',
      ),
  });
}

export function useSaveExamMutation(
  token: string,
  editingExamId: string | null,
  onSuccess: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: ExamForm) => {
      const input = {
        name: form.name.trim(),
        categoryIds: form.categoryIds,
        usesMonth: form.usesMonth,
        usesGrade: form.usesGrade,
        usesRound: form.usesRound,
      };
      if (!input.name || input.categoryIds.length === 0) {
        throw new Error('시험 이름과 분류를 입력해 주세요.');
      }
      return editingExamId
        ? updateExam(token, editingExamId, input)
        : createExam(token, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceDataKeys.all });
      onSuccess();
      toast.success(
        editingExamId ? '시험을 수정했습니다.' : '시험을 추가했습니다.',
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '시험 저장에 실패했습니다.',
      ),
  });
}
