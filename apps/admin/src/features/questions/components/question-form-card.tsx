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
import { Separator } from '@kichulbot/ui/components/ui/separator';
import { Textarea } from '@kichulbot/ui/components/ui/textarea';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  type ComponentProps,
  type KeyboardEvent,
  type RefObject,
  useEffect,
} from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { NumberField, SelectField } from '@/shared/components/form-fields';

import { getNextTagIds } from '../question-tag-utils';
import type { QuestionValues } from '../types';
import { QuestionExtractedText } from './question-extracted-text';
import { QuestionImageField } from './question-image-field';
import { RecommendedTagButtons } from './recommended-tag-buttons';

interface QuestionFormCardProps {
  formCardRef: RefObject<HTMLDivElement | null>;
  questionForm: UseFormReturn<QuestionValues>;
  imageField: Omit<
    ComponentProps<typeof QuestionImageField>,
    'existingImageUrl'
  >;
  editingQuestion: AdminPaperQuestionResponse | null;
  selectableTags: TagResponse[];
  isComplete: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isTagsEmpty: boolean;
  questionCount: number;
  previousQuestion: AdminPaperQuestionResponse | null;
  nextQuestion: AdminPaperQuestionResponse | null;
  onCreate: () => void;
  onDelete: (question: AdminPaperQuestionResponse) => void;
  onMove: (direction: 'previous' | 'next') => void;
  onSubmit: (values: QuestionValues) => void;
}

export function QuestionFormCard({
  formCardRef,
  questionForm,
  imageField,
  editingQuestion,
  selectableTags,
  isComplete,
  isSaving,
  isDeleting,
  isTagsEmpty,
  questionCount,
  previousQuestion,
  nextQuestion,
  onCreate,
  onDelete,
  onMove,
  onSubmit,
}: QuestionFormCardProps) {
  const questionType = questionForm.watch('type');
  const gradingPolicy = questionForm.watch('gradingPolicy');
  const { setValue } = questionForm;

  useEffect(() => {
    if (questionType !== 'WRITTEN') return;

    setValue('choiceCount', null, { shouldValidate: true });
    setValue('answerChoice', null, { shouldValidate: true });
  }, [questionType, setValue]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!editingQuestion || event.currentTarget !== event.target) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onMove('previous');
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onMove('next');
    }
  }

  return (
    <div
      ref={formCardRef}
      tabIndex={editingQuestion ? -1 : undefined}
      onKeyDown={handleKeyDown}
    >
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onCreate}
                >
                  <Plus className="size-4" aria-hidden="true" />새 문항
                </Button>
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
              onSubmit={questionForm.handleSubmit(onSubmit)}
            >
              <FieldGroup>
                <QuestionImageField
                  {...imageField}
                  existingImageUrl={editingQuestion?.imageUrl}
                />
                {editingQuestion && (
                  <QuestionExtractedText question={editingQuestion} />
                )}
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
                  <SelectField
                    control={questionForm.control}
                    name="type"
                    label="문항 유형"
                    items={[
                      { value: 'MULTIPLE_CHOICE', label: '객관식' },
                      { value: 'WRITTEN', label: '서술형' },
                    ]}
                  />
                </div>

                {questionType === 'MULTIPLE_CHOICE' ? (
                  <div
                    className="
                      grid gap-3
                      sm:grid-cols-3
                    "
                  >
                    <NumberField
                      control={questionForm.control}
                      name="choiceCount"
                      label="선택지"
                    />
                    <SelectField
                      control={questionForm.control}
                      name="gradingPolicy"
                      label="채점 방식"
                      items={[
                        { value: 'EXACT', label: '정답 번호 지정' },
                        { value: 'ANY_CHOICE', label: '정답없음' },
                      ]}
                      onSelectedValueChange={(value) => {
                        if (value === 'ANY_CHOICE') {
                          questionForm.setValue('answerChoice', null, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                    {gradingPolicy === 'EXACT' && (
                      <NumberField
                        control={questionForm.control}
                        name="answerChoice"
                        label="정답"
                      />
                    )}
                  </div>
                ) : (
                  <Controller
                    name="answerText"
                    control={questionForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>모범답안</FieldLabel>
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
                      {editingQuestion && (
                        <RecommendedTagButtons
                          question={editingQuestion}
                          tags={selectableTags}
                          selectedTagIds={field.value}
                          onApply={(tag) =>
                            field.onChange(
                              getNextTagIds(
                                field.value,
                                tag,
                                selectableTags,
                                true,
                              ),
                            )
                          }
                        />
                      )}
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
                      {isTagsEmpty && (
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
                    disabled={isDeleting}
                    onClick={() => onDelete(editingQuestion)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                )}
                <Button className="flex-1" type="submit" disabled={isSaving}>
                  <Upload className="size-4" aria-hidden="true" />
                  {editingQuestion ? '문항 수정' : '문항 등록'}
                </Button>
              </div>
              {editingQuestion && (
                <div
                  className="
                    grid gap-2
                    sm:grid-cols-2
                  "
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!previousQuestion}
                    aria-keyshortcuts="ArrowLeft"
                    onClick={() => onMove('previous')}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    이전문항
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!nextQuestion}
                    aria-keyshortcuts="ArrowRight"
                    onClick={() => onMove('next')}
                  >
                    다음문항
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
