import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { PaperDetailHeader } from '@/features/papers/components/paper-detail-header';
import { QuestionProgress } from '@/features/papers/components/question-progress';
import {
  useDeletePaperMutation,
  useUpdatePaperMetadataMutation,
  useUpdatePaperPublishedMutation,
} from '@/features/papers/queries/mutations';
import { paperQueryOptions } from '@/features/papers/queries/options';
import { tagsQueryOptions } from '@/features/tags/queries/options';

import { useQuestionImage } from '../hooks/use-question-image';
import { findNextQuestionNumber } from '../lib/question-number';
import { getNextTagIds, mergeTags, sortTags } from '../lib/question-tag-utils';
import {
  useDeleteQuestionMutation,
  useSaveQuestionMutation,
  useUpdateQuestionTagsMutation,
} from '../queries/mutations';
import { questionSchema } from '../schemas';
import type { QuestionValues } from '../types';
import { QuestionFormCard } from './question-form-card';
import { QuestionList } from './question-list';

const DEFAULT_QUESTION: QuestionValues = {
  type: 'MULTIPLE_CHOICE',
  number: 1,
  choiceCount: 5,
  gradingPolicy: 'EXACT',
  answerChoice: 1,
  answerText: '',
  explanation: '',
  points: 5,
  recommendedTimeSeconds: null,
  recommendedTagIds: [],
  tagIds: [],
};

export function QuestionManager({
  paperId,
  token,
}: {
  paperId: string;
  token: string;
}) {
  const navigate = useNavigate();
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const imageField = useQuestionImage();

  const paperQuery = useSuspenseQuery(paperQueryOptions(token, paperId));
  const paper = paperQuery.data.paper;
  const tagsQuery = useQuery(tagsQueryOptions(token, paper.exam.id));

  const questions = useMemo(
    () => [...paper.questions].sort((a, b) => a.number - b.number),
    [paper.questions],
  );
  const editingQuestion =
    questions.find((question) => question.id === editingQuestionId) ?? null;
  const selectableTags = useMemo(() => {
    const tags = new Map<string, TagResponse>(
      (tagsQuery.data?.tags ?? []).map((tag) => [tag.id, tag]),
    );
    editingQuestion?.tags.forEach((tag) => tags.set(tag.id, tag));
    return sortTags([...tags.values()]);
  }, [editingQuestion, tagsQuery.data?.tags]);
  const registeredQuestionCount = paper.registeredQuestionCount;
  const taggedQuestionCount = questions.filter(
    (question) => question.tags.length > 0,
  ).length;
  const questionCount = paper.questionCount;
  const isComplete = registeredQuestionCount >= questionCount;

  const questionForm = useForm<QuestionValues>({
    resolver: standardSchemaResolver(questionSchema),
    defaultValues: DEFAULT_QUESTION,
  });
  const editingQuestionIndex = questions.findIndex(
    (question) => question.id === editingQuestionId,
  );
  const previousQuestion =
    editingQuestionIndex > 0 ? questions[editingQuestionIndex - 1] : null;
  const nextQuestion =
    editingQuestionIndex >= 0 && editingQuestionIndex < questions.length - 1
      ? questions[editingQuestionIndex + 1]
      : null;

  const resetFormForQuestion = useCallback(
    (question: AdminPaperQuestionResponse) => {
      setEditingQuestionId(question.id);
      imageField.reset();
      questionForm.reset({
        type: question.type,
        number: question.number,
        choiceCount: question.choiceCount ?? null,
        gradingPolicy: question.gradingPolicy ?? 'EXACT',
        answerChoice: question.answerChoice ?? null,
        answerText: question.answerText ?? '',
        explanation: question.explanation ?? '',
        points: question.points,
        recommendedTimeSeconds: question.recommendedTimeSeconds ?? null,
        recommendedTagIds: question.recommendedTagIds,
        tagIds: question.tags.map((tag) => tag.id),
      });
    },
    [imageField, questionForm],
  );

  useEffect(() => {
    if (!editingQuestionId) return;
    formCardRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
    formCardRef.current?.focus({ preventScroll: true });
  }, [editingQuestionId]);

  const beginCreate = useCallback(
    (nextQuestions = questions) => {
      const nextQuestionNumber = findNextQuestionNumber(
        nextQuestions,
        questionCount,
      );
      setEditingQuestionId(null);
      imageField.reset();
      questionForm.reset({
        ...DEFAULT_QUESTION,
        number: nextQuestionNumber ?? DEFAULT_QUESTION.number,
      });
    },
    [imageField, questionCount, questionForm, questions],
  );

  function beginEdit(question: AdminPaperQuestionResponse) {
    resetFormForQuestion(question);
  }

  const moveToQuestion = useCallback(
    (direction: 'previous' | 'next') => {
      const targetQuestion =
        direction === 'previous' ? previousQuestion : nextQuestion;
      if (!targetQuestion) return;

      resetFormForQuestion(targetQuestion);
    },
    [nextQuestion, previousQuestion, resetFormForQuestion],
  );

  const saveQuestionMutation = useSaveQuestionMutation({
    token,
    paperId,
    editingQuestionId,
    image: imageField.image,
    onSuccess: (question) => {
      if (editingQuestionId) {
        resetFormForQuestion(question);
        return;
      }
      const nextQuestions = [
        ...questions.filter((item) => item.id !== question.id),
        question,
      ];
      beginCreate(nextQuestions);
    },
  });
  const updateQuestionTagsMutation = useUpdateQuestionTagsMutation({
    token,
    paperId,
    onSuccess: (question) => {
      if (editingQuestionId === question.id) {
        resetFormForQuestion(question);
      }
    },
  });

  const deleteQuestionMutation = useDeleteQuestionMutation({
    token,
    paperId,
    onSuccess: (id) => {
      const nextQuestions = questions.filter((question) => question.id !== id);
      beginCreate(nextQuestions);
    },
  });

  const updatePaperPublishedMutation = useUpdatePaperPublishedMutation(
    token,
    paperId,
  );
  const updatePaperMetadataMutation = useUpdatePaperMetadataMutation(
    token,
    paperId,
  );
  const deletePaperMutation = useDeletePaperMutation(token, paperId, () =>
    navigate('/'),
  );

  function handleDeletePaper() {
    const shouldDelete = window.confirm(
      `${paper.title} 문제지와 등록된 ${registeredQuestionCount}개 문항을 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
    );
    if (shouldDelete) {
      deletePaperMutation.mutate();
    }
  }

  function handleDeleteQuestion(question: AdminPaperQuestionResponse) {
    const shouldDelete = window.confirm(
      `${question.number}번 문항과 등록된 이미지를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
    );
    if (shouldDelete) {
      deleteQuestionMutation.mutate(question.id);
    }
  }

  function handleAddQuestionTag(
    question: AdminPaperQuestionResponse,
    tagId: string,
  ) {
    const tag = selectableTags.find((item) => item.id === tagId);
    if (!tag) return;

    const questionTags = mergeTags(selectableTags, question.tags);
    updateQuestionTagsMutation.mutate({
      question,
      tagIds: getNextTagIds(
        question.tags.map((item) => item.id),
        tag,
        questionTags,
        true,
      ),
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <PaperDetailHeader
        paper={paper}
        isUpdating={updatePaperPublishedMutation.isPending}
        isUpdatingMetadata={updatePaperMetadataMutation.isPending}
        isDeleting={deletePaperMutation.isPending}
        onUpdateMetadata={(values, options) =>
          updatePaperMetadataMutation.mutate(values, options)
        }
        onPublishedChange={(checked) =>
          updatePaperPublishedMutation.mutate(checked)
        }
        onDelete={handleDeletePaper}
      />
      <QuestionProgress
        registered={registeredQuestionCount}
        tagged={taggedQuestionCount}
        total={questionCount}
      />

      <div
        className="
          grid gap-5
          lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]
        "
      >
        <QuestionList
          questions={questions}
          tags={selectableTags}
          isLoadingTags={tagsQuery.isLoading}
          addingTagQuestionId={
            updateQuestionTagsMutation.isPending
              ? (updateQuestionTagsMutation.variables?.question.id ?? null)
              : null
          }
          editingQuestionId={editingQuestionId}
          onEdit={beginEdit}
          onAddTag={handleAddQuestionTag}
        />

        <QuestionFormCard
          formCardRef={formCardRef}
          questionForm={questionForm}
          imageField={imageField}
          editingQuestion={editingQuestion}
          selectableTags={selectableTags}
          isComplete={isComplete}
          isSaving={saveQuestionMutation.isPending}
          isDeleting={deleteQuestionMutation.isPending}
          isTagsEmpty={(tagsQuery.data?.tags.length ?? 0) === 0}
          questionCount={questionCount}
          previousQuestion={previousQuestion}
          nextQuestion={nextQuestion}
          onCreate={() => beginCreate()}
          onDelete={handleDeleteQuestion}
          onMove={moveToQuestion}
          onSubmit={(values) => saveQuestionMutation.mutate(values)}
        />
      </div>
    </div>
  );
}
