import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { TagForm, TagGroupForm } from '../../types';
import {
  createTag,
  createTagGroup,
  deleteTag,
  deleteTagGroup,
  updateTag,
  updateTagGroup,
} from '../client/mutations';
import { tagKeys } from './queries';

function useInvalidateTags() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: tagKeys.adminList() });
    queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
    queryClient.invalidateQueries({ queryKey: tagKeys.groupLists() });
  };
}

export function useSaveTagMutation(
  token: string,
  editingTagId: string | null,
  onSuccess: () => void,
) {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: (form: TagForm) => {
      const input = {
        name: form.name.trim(),
        keywords: form.keywords,
        examId: form.examId,
        tagGroupId: form.tagGroupId,
      };
      if (!input.name) throw new Error('태그 이름을 입력해 주세요.');
      if (!input.examId) throw new Error('시험을 선택해 주세요.');
      return editingTagId
        ? updateTag(token, editingTagId, input)
        : createTag(token, input);
    },
    onSuccess: () => {
      invalidateTags();
      onSuccess();
      toast.success(
        editingTagId ? '태그를 수정했습니다.' : '태그를 추가했습니다.',
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '태그 저장에 실패했습니다.',
      ),
  });
}

export function useSaveTagGroupMutation(
  token: string,
  editingTagGroupId: string | null,
  onSuccess: () => void,
) {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: (form: TagGroupForm) => {
      const input = {
        examId: form.examId,
        name: form.name.trim(),
        selectionMode: form.selectionMode,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (!input.examId) throw new Error('시험을 선택해 주세요.');
      if (!input.name) throw new Error('그룹 이름을 입력해 주세요.');
      return editingTagGroupId
        ? updateTagGroup(token, editingTagGroupId, input)
        : createTagGroup(token, input);
    },
    onSuccess: () => {
      invalidateTags();
      onSuccess();
      toast.success(
        editingTagGroupId
          ? '태그 그룹을 수정했습니다.'
          : '태그 그룹을 추가했습니다.',
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : '태그 그룹 저장에 실패했습니다.',
      ),
  });
}

export function useDeleteTagGroupMutation(
  token: string,
  onSuccess?: (tagGroupId: string) => void,
) {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: (tagGroupId: string) => deleteTagGroup(token, tagGroupId),
    onSuccess: ({ id }) => {
      invalidateTags();
      onSuccess?.(id);
      toast.success('태그 그룹을 삭제했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : '태그 그룹 삭제에 실패했습니다.',
      ),
  });
}

export function useDeleteTagMutation(
  token: string,
  onSuccess?: (tagId: string) => void,
) {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: (tagId: string) => deleteTag(token, tagId),
    onSuccess: ({ id }) => {
      invalidateTags();
      onSuccess?.(id);
      toast.success('태그를 삭제했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '태그 삭제에 실패했습니다.',
      ),
  });
}
