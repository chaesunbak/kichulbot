import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Exam } from '@/shared/types';

import {
  createPaper,
  createPaperImportDraft,
  createPaperWithQuestions,
  deletePaper,
  updatePaperPublished,
} from './api';
import {
  toCreatePaperInput,
  toCreatePaperQuestionImages,
  toCreatePaperWithQuestionsInput,
} from './mappers';
import { paperKeys } from './queries';
import type {
  ImportPaperQuestionValues,
  ImportPaperValues,
  PaperValues,
} from './types';

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

export function useCreatePaperImportDraftMutation({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: (
    draft: Awaited<ReturnType<typeof createPaperImportDraft>>,
  ) => void;
}) {
  return useMutation({
    mutationFn: ({
      questionPdf,
      answerPdf,
      layout,
      variant,
    }: {
      questionPdf: File | null;
      answerPdf: File | null;
      layout: string;
      variant: string;
    }) => {
      if (!questionPdf || !answerPdf) {
        throw new Error('문제 PDF와 답지 PDF를 모두 선택해 주세요.');
      }
      return createPaperImportDraft(token, {
        questionPdf,
        answerPdf,
        layout,
        variant,
      });
    },
    onSuccess: (draft) => {
      onSuccess(draft);
      toast.success(`${draft.questions.length}개 문항 초안을 추출했습니다.`);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'PDF 추출에 실패했습니다.',
      ),
  });
}

export function useCreatePaperWithQuestionsMutation({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: (paperId: string) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      exam,
      questions,
    }: {
      values: ImportPaperValues;
      exam: Exam;
      questions: ImportPaperQuestionValues[];
    }) =>
      createPaperWithQuestions(
        token,
        toCreatePaperWithQuestionsInput(values, exam, questions),
        toCreatePaperQuestionImages(questions),
      ),
    onSuccess: ({ paper }) => {
      queryClient.invalidateQueries({ queryKey: paperKeys.lists() });
      toast.success('PDF 초안으로 문제지를 생성했습니다.');
      onSuccess(paper.id);
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
