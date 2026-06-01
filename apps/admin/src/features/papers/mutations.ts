import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPaper, deletePaper, updatePaperPublished } from './api';
import { toCreatePaperInput } from './mappers';
import { paperKeys } from './queries';
import type { PaperValues } from './schemas';
import type { Exam } from '@/shared/api/api-client';

export function useCreatePaperMutation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, exam }: { values: PaperValues; exam: Exam }) =>
      createPaper(token, toCreatePaperInput(values, exam)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paperKeys.lists() });
      toast.success('문제지를 생성했습니다.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '문제지 생성에 실패했습니다.',
      ),
  });
}

export function useUpdatePaperPublishedMutation(
  token: string,
  paperId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPublished: boolean) =>
      updatePaperPublished(token, paperId, isPublished),
    onSuccess: ({ paper }) => {
      queryClient.setQueryData(paperKeys.detail(paperId), { paper });
      queryClient.invalidateQueries({ queryKey: paperKeys.lists() });
      toast.success(
        paper.isPublished
          ? '문제지를 공개했습니다.'
          : '문제지를 비공개로 전환했습니다.',
      );
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : '공개 상태 변경에 실패했습니다.',
      ),
  });
}

export function useDeletePaperMutation(
  token: string,
  paperId: string,
  onSuccess: () => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePaper(token, paperId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: paperKeys.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: paperKeys.lists() });
      toast.success('문제지를 삭제했습니다.');
      onSuccess();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : '문제지 삭제에 실패했습니다.',
      ),
  });
}
