import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createCategory,
  createExam,
  deleteCategory,
  deleteExam,
  updateCategory,
  updateExam,
} from './api';
import { referenceDataKeys } from './queries';
import type { CategoryForm, ExamForm } from './types';

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

export function useDeleteCategoryMutation(
  token: string,
  onSuccess?: (categoryId: string) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(token, categoryId),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: referenceDataKeys.all });
      onSuccess?.(id);
      toast.success('분류를 삭제했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '분류 삭제에 실패했습니다.',
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
        slug: form.slug.trim(),
        categoryIds: form.categoryIds,
        usesMonth: form.usesMonth,
        usesRound: form.usesRound,
      };
      if (!input.name) {
        throw new Error('시험 이름을 입력해 주세요.');
      }
      if (!input.slug) {
        throw new Error('시험 슬러그를 입력해 주세요.');
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

export function useDeleteExamMutation(
  token: string,
  onSuccess?: (examId: string) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => deleteExam(token, examId),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: referenceDataKeys.all });
      onSuccess?.(id);
      toast.success('시험을 삭제했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '시험 삭제에 실패했습니다.',
      ),
  });
}
