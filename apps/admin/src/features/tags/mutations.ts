import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createOfficialTag, deleteOfficialTag, updateOfficialTag } from './api';
import { tagKeys } from './queries';

export interface TagForm {
  name: string;
  examId: string;
}

function useInvalidateTags() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: tagKeys.adminList() });
    queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
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
        examId: form.examId,
      };
      if (!input.name) throw new Error('태그 이름을 입력해 주세요.');
      if (!input.examId) throw new Error('시험을 선택해 주세요.');
      return editingTagId
        ? updateOfficialTag(token, editingTagId, input)
        : createOfficialTag(token, input);
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

export function useDeleteTagMutation(
  token: string,
  onSuccess?: (tagId: string) => void,
) {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: (tagId: string) => deleteOfficialTag(token, tagId),
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
