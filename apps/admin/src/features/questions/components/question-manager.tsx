import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type { AdminPaperQuestionResponse } from '@kichulbot/api-contract/papers';
import type { TagResponse } from '@kichulbot/api-contract/tags';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Checkbox } from '@kichulbot/ui/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/ui/select';
import { Separator } from '@kichulbot/ui/components/ui/separator';
import { Textarea } from '@kichulbot/ui/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';

import { PaperDetailHeader } from '@/features/papers/components/paper-detail-header';
import { QuestionProgress } from '@/features/papers/components/question-progress';
import {
  useDeletePaperMutation,
  useUpdatePaperPublishedMutation,
} from '@/features/papers/mutations';
import { paperQueryOptions } from '@/features/papers/queries';
import { tagsQueryOptions } from '@/features/tags/queries';

import { useQuestionImage } from '../hooks/use-question-image';
import {
  useDeleteQuestionMutation,
  useSaveQuestionMutation,
  useUpdateQuestionTagsMutation,
} from '../mutations';
import { questionSchema } from '../schemas';
import type { QuestionValues } from '../types';
import { QuestionImageField } from './question-image-field';
import { QuestionList } from './question-list';

const DEFAULT_QUESTION: QuestionValues = {
  type: 'MULTIPLE_CHOICE',
  number: 1,
  choiceCount: 5,
  answerChoice: 1,
  answerText: '',
  explanation: '',
  points: 5,
  recommendedTimeSeconds: undefined,
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
  const formCardRef = React.useRef<HTMLDivElement | null>(null);
  const [editingQuestionId, setEditingQuestionId] = React.useState<
    string | null
  >(null);
  const imageField = useQuestionImage();

  const paperQuery = useQuery(paperQueryOptions(token, paperId));
  const paper = paperQuery.data?.paper;
  const tagsQuery = useQuery({
    ...tagsQueryOptions(token, paper?.exam.id),
    enabled: !!paper,
  });

  const questions = React.useMemo(
    () => [...(paper?.questions ?? [])].sort((a, b) => a.number - b.number),
    [paper?.questions],
  );
  const editingQuestion =
    questions.find((question) => question.id === editingQuestionId) ?? null;
  const selectableTags = React.useMemo(() => {
    const tags = new Map(
      (tagsQuery.data?.tags ?? []).map((tag) => [tag.id, tag]),
    );
    editingQuestion?.tags.forEach((tag) => tags.set(tag.id, tag));
    return [...tags.values()];
  }, [editingQuestion, tagsQuery.data?.tags]);
  const registeredQuestionCount = paper?.registeredQuestionCount ?? 0;
  const taggedQuestionCount = questions.filter(
    (question) => question.tags.length > 0,
  ).length;
  const questionCount = paper?.questionCount ?? 20;
  const isComplete = registeredQuestionCount >= questionCount;

  const questionForm = useForm<QuestionValues>({
    resolver: standardSchemaResolver(questionSchema),
    defaultValues: DEFAULT_QUESTION,
  });
  const questionType = questionForm.watch('type');
  const editingQuestionIndex = questions.findIndex(
    (question) => question.id === editingQuestionId,
  );
  const previousQuestion =
    editingQuestionIndex > 0 ? questions[editingQuestionIndex - 1] : null;
  const nextQuestion =
    editingQuestionIndex >= 0 && editingQuestionIndex < questions.length - 1
      ? questions[editingQuestionIndex + 1]
      : null;

  const resetFormForQuestion = React.useCallback(
    (question: AdminPaperQuestionResponse) => {
      setEditingQuestionId(question.id);
      imageField.reset();
      questionForm.reset({
        type: question.type,
        number: question.number,
        choiceCount: question.choiceCount ?? undefined,
        answerChoice: question.answerChoice ?? undefined,
        answerText: question.answerText ?? '',
        explanation: question.explanation ?? '',
        points: question.points,
        recommendedTimeSeconds: question.recommendedTimeSeconds ?? undefined,
        tagIds: question.tags.map((tag) => tag.id),
      });
    },
    [imageField, questionForm],
  );

  React.useEffect(() => {
    if (!editingQuestionId) return;
    formCardRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
  }, [editingQuestionId]);

  const beginCreate = React.useCallback(
    (nextQuestions = questions) => {
      setEditingQuestionId(null);
      imageField.reset();
      questionForm.reset({
        ...DEFAULT_QUESTION,
        number: findNextQuestionNumber(nextQuestions, questionCount),
      });
    },
    [imageField, questionCount, questionForm, questions],
  );

  function beginEdit(question: AdminPaperQuestionResponse) {
    resetFormForQuestion(question);
  }

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
  const deletePaperMutation = useDeletePaperMutation(token, paperId, () =>
    navigate('/'),
  );

  function handleDeletePaper() {
    const shouldDelete = window.confirm(
      `${paper?.title ?? '이 문제지'} 문제지와 등록된 ${registeredQuestionCount}개 문항을 모두 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
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

  if (paperQuery.isLoading) {
    return (
      <div
        className="
          mx-auto flex max-w-7xl items-center justify-center px-5 py-24 text-sm
          text-muted-foreground
        "
      >
        <RefreshCw className="mr-2 size-4 animate-spin" aria-hidden="true" />
        문제지 상세 불러오는 중
      </div>
    );
  }

  if (!paper || paperQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-6">
        <Card>
          <CardHeader>
            <CardTitle>문제지를 불러오지 못했습니다.</CardTitle>
            <CardDescription>
              {paperQuery.error instanceof Error
                ? paperQuery.error.message
                : '잠시 후 다시 시도해 주세요.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="size-4" aria-hidden="true" />
                목록으로
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <PaperDetailHeader
        paper={paper}
        isUpdating={updatePaperPublishedMutation.isPending}
        isDeleting={deletePaperMutation.isPending}
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

        <div ref={formCardRef}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {editingQuestion
                      ? `${editingQuestion.number}번 문항 수정`
                      : '문항 등록'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {editingQuestion
                      ? '이미지를 바꾸지 않으면 기존 이미지를 유지합니다.'
                      : '문제 이미지를 포함해 새 문항을 등록합니다.'}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {editingQuestion && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!previousQuestion}
                        onClick={() =>
                          previousQuestion && beginEdit(previousQuestion)
                        }
                      >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                        이전문제
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!nextQuestion}
                        onClick={() => nextQuestion && beginEdit(nextQuestion)}
                      >
                        다음문제
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => beginCreate()}
                      >
                        <Plus className="size-4" aria-hidden="true" />새 문항
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!editingQuestion && isComplete ? (
                <div
                  className="
                    rounded-md border border-dashed px-4 py-10 text-center
                  "
                >
                  <CheckCircle2
                    className="mx-auto size-6 text-primary"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium">
                    {questionCount}문항 등록을 완료했습니다.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    왼쪽 문항을 선택하면 내용을 수정할 수 있습니다.
                  </p>
                </div>
              ) : (
                <form
                  className="space-y-5"
                  onSubmit={questionForm.handleSubmit((values) =>
                    saveQuestionMutation.mutate(values),
                  )}
                >
                  <FieldGroup>
                    <QuestionImageField
                      {...imageField}
                      existingImageUrl={editingQuestion?.imageUrl}
                    />
                    <div
                      className="
                        grid gap-3
                        sm:grid-cols-2
                      "
                    >
                      <NumberField
                        control={questionForm.control}
                        name="number"
                        label="문항 번호"
                      />
                      <NumberField
                        control={questionForm.control}
                        name="points"
                        label="배점"
                      />
                      <Controller
                        name="type"
                        control={questionForm.control}
                        render={({ field }) => (
                          <Field>
                            <FieldLabel htmlFor={field.name}>
                              문항 유형
                            </FieldLabel>
                            <Select
                              name={field.name}
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger id={field.name} className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MULTIPLE_CHOICE">
                                  객관식
                                </SelectItem>
                                <SelectItem value="WRITTEN">서술형</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      />
                    </div>

                    {questionType === 'MULTIPLE_CHOICE' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <NumberField
                          control={questionForm.control}
                          name="choiceCount"
                          label="선택지"
                        />
                        <NumberField
                          control={questionForm.control}
                          name="answerChoice"
                          label="정답"
                        />
                      </div>
                    ) : (
                      <Controller
                        name="answerText"
                        control={questionForm.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                              모범답안
                            </FieldLabel>
                            <Textarea
                              {...field}
                              id={field.name}
                              value={field.value ?? ''}
                              aria-invalid={fieldState.invalid}
                              placeholder="서술형 문항의 모범답안을 입력해 주세요."
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    )}

                    <NumberField
                      control={questionForm.control}
                      name="recommendedTimeSeconds"
                      label="권장 풀이시간(초)"
                    />

                    <Controller
                      name="explanation"
                      control={questionForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={field.name}>해설</FieldLabel>
                          <Textarea
                            {...field}
                            id={field.name}
                            value={field.value ?? ''}
                            aria-invalid={fieldState.invalid}
                            placeholder="선택 입력입니다."
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />

                    <Controller
                      name="tagIds"
                      control={questionForm.control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>태그</FieldLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {selectableTags.map((tag) => {
                              const checked = field.value.includes(tag.id);
                              return (
                                <label
                                  key={tag.id}
                                  className="
                                    flex cursor-pointer items-center gap-2
                                    rounded-md border px-3 py-2 text-sm
                                  "
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) =>
                                      field.onChange(
                                        getNextTagIds(
                                          field.value,
                                          tag,
                                          selectableTags,
                                          nextChecked === true,
                                        ),
                                      )
                                    }
                                  />
                                  {tag.name}
                                </label>
                              );
                            })}
                          </div>
                          {(tagsQuery.data?.tags.length ?? 0) === 0 && (
                            <FieldDescription>
                              이 과목에 적용 가능한 태그가 없습니다.
                            </FieldDescription>
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <Separator />
                  <div className="flex gap-2">
                    {editingQuestion && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={`${editingQuestion.number}번 문항 삭제`}
                        disabled={deleteQuestionMutation.isPending}
                        onClick={() => handleDeleteQuestion(editingQuestion)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                    <Button
                      className="flex-1"
                      type="submit"
                      disabled={saveQuestionMutation.isPending}
                    >
                      <Upload className="size-4" aria-hidden="true" />
                      {editingQuestion ? '문항 수정' : '문항 등록'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<QuestionValues>>['control'];
  name:
    | 'number'
    | 'points'
    | 'choiceCount'
    | 'answerChoice'
    | 'recommendedTimeSeconds';
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            name={field.name}
            value={field.value ?? ''}
            onBlur={field.onBlur}
            ref={field.ref}
            onChange={(event) =>
              field.onChange(
                event.target.value === ''
                  ? undefined
                  : Number(event.target.value),
              )
            }
            type="number"
            inputMode="numeric"
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function findNextQuestionNumber(
  questions: Array<{ number: number }>,
  questionCount: number,
) {
  const numbers = new Set(questions.map((question) => question.number));
  for (let number = 1; number <= questionCount; number += 1) {
    if (!numbers.has(number)) {
      return number;
    }
  }
  return questionCount;
}

function getNextTagIds(
  currentTagIds: string[],
  selectedTag: TagResponse,
  tags: TagResponse[],
  checked: boolean,
) {
  if (!checked) {
    return currentTagIds.filter((tagId) => tagId !== selectedTag.id);
  }

  const selectedTagIds = new Set(currentTagIds);
  const tagGroup = selectedTag.tagGroup;
  if (tagGroup?.selectionMode === 'SINGLE') {
    tags
      .filter((tag) => tag.tagGroup?.id === tagGroup.id)
      .forEach((tag) => selectedTagIds.delete(tag.id));
  }

  selectedTagIds.add(selectedTag.id);
  return [...selectedTagIds];
}

function mergeTags(...tagGroups: TagResponse[][]) {
  const tags = new Map<string, TagResponse>();
  tagGroups.flat().forEach((tag) => tags.set(tag.id, tag));
  return [...tags.values()];
}
