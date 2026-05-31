import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOfficialTag, updateOfficialTag } from './api';
import { tagKeys } from './queries';

export interface TagForm {
  name: string;
  slug: string;
  subjectIds: string[];
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
        slug: form.slug.trim(),
        subjectIds: form.subjectIds,
      };
      if (!input.name || !input.slug)
        throw new Error('태그 이름과 slug를 입력해 주세요.');
      return editingTagId
        ? updateOfficialTag(token, editingTagId, input)
        : createOfficialTag(token, input);
    },
    onSuccess: () => {
      invalidateTags();
      onSuccess();
      toast.success(
        editingTagId
          ? '공식 태그를 수정했습니다.'
          : '공식 태그를 추가했습니다.',
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : '공식 태그 저장에 실패했습니다.',
      ),
  });
}

export function useUpdateTagActiveMutation(token: string) {
  const invalidateTags = useInvalidateTags();
  return useMutation({
    mutationFn: ({ tagId, isActive }: { tagId: string; isActive: boolean }) =>
      updateOfficialTag(token, tagId, { isActive }),
    onSuccess: () => {
      invalidateTags();
      toast.success('공식 태그 상태를 변경했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '상태 변경에 실패했습니다.',
      ),
  });
}
