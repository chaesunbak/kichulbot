import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import type {
  AdminTagGroupResponse,
  AdminTagResponse,
} from '@kichulbot/api-contract/tags';
import {
  type AdminExamResponse,
  type AdminTaxonomyResponse,
} from '@kichulbot/api-contract/taxonomy';
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
  FieldError,
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
import { Plus } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { examFormSchema } from '@/features/reference-data/schemas';
import type { ExamForm } from '@/features/reference-data/types';

export interface ExamFormPanelProps {
  categories: AdminTaxonomyResponse[];
  tagGroups: AdminTagGroupResponse[];
  tags: Array<AdminTagResponse | unknown>;
  editingExam: AdminExamResponse | null;
  isSubmitting: boolean;
  onSubmit: (values: ExamForm) => void;
  onCancel: () => void;
}

export function ExamFormPanel({
  categories,
  tagGroups,
  tags,
  editingExam,
  isSubmitting,
  onSubmit,
  onCancel,
}: ExamFormPanelProps) {
  const form = useForm<ExamForm>({
    resolver: standardSchemaResolver(examFormSchema),
    defaultValues: getExamFormValues(editingExam),
  });

  React.useEffect(() => {
    form.reset(getExamFormValues(editingExam));
  }, [editingExam, form]);

  const eraTagGroupId = form.watch('eraTagGroupId');
  const adminTags = tags.filter(isAdminTag);
  const eraTags = adminTags.filter((tag) => tag.tagGroupId === eraTagGroupId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" aria-hidden="true" />
          {editingExam ? '시험 수정' : '시험 추가'}
        </CardTitle>
        <CardDescription>
          문제지 등록에서 선택할 시험과 시행 정보 항목을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            control={form.control}
            name="name"
            label="시험 이름"
            placeholder="수능 한국사"
          />
          <TextField
            control={form.control}
            name="slug"
            label="시험 슬러그"
            placeholder="korean-history-advanced"
          />
          <Controller
            name="categoryIds"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>분류</FieldLabel>
                <div className="grid gap-2">
                  {categories.map((category) => {
                    const checked = field.value.includes(category.id);
                    return (
                      <ToggleRow
                        key={category.id}
                        label={category.name}
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          field.onChange(
                            nextChecked
                              ? [...field.value, category.id]
                              : field.value.filter((id) => id !== category.id),
                          )
                        }
                      />
                    );
                  })}
                </div>
              </Field>
            )}
          />
          <Field>
            <FieldLabel>시행 정보</FieldLabel>
            <div className="grid gap-2">
              <Controller
                name="usesMonth"
                control={form.control}
                render={({ field }) => (
                  <ToggleRow
                    label="시행 월 입력"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="usesRound"
                control={form.control}
                render={({ field }) => (
                  <ToggleRow
                    label="시험 회차 입력"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </Field>
          {editingExam && (
            <MockExamFields
              tagGroups={tagGroups}
              adminTags={adminTags}
              eraTags={eraTags}
              control={form.control}
              setValue={form.setValue}
            />
          )}
          <div className="flex gap-2">
            {editingExam && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button className="flex-1" type="submit" disabled={isSubmitting}>
              {editingExam ? '수정 저장' : '시험 추가'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MockExamFields({
  tagGroups,
  adminTags,
  eraTags,
  control,
  setValue,
}: {
  tagGroups: AdminTagGroupResponse[];
  adminTags: AdminTagResponse[];
  eraTags: AdminTagResponse[];
  control: ReturnType<typeof useForm<ExamForm>>['control'];
  setValue: ReturnType<typeof useForm<ExamForm>>['setValue'];
}) {
  return (
    <Field>
      <FieldLabel>모의고사 설정</FieldLabel>
      <div className="grid gap-3 rounded-md border p-3">
        <Controller
          name="mockExamQuestionCount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>총 문항수</FieldLabel>
              <Input
                id={field.name}
                type="number"
                min={1}
                max={100}
                value={field.value ?? ''}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={fieldState.invalid}
                placeholder="20"
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ''
                      ? null
                      : Number(event.target.value),
                  )
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="eraTagGroupId"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>시대 태그 그룹</FieldLabel>
              <Select
                value={field.value ?? 'none'}
                onValueChange={(value) => {
                  const nextValue = value === 'none' ? null : value;
                  field.onChange(nextValue);
                  setValue(
                    'mockExamBlueprintItems',
                    adminTags
                      .filter((tag) => tag.tagGroupId === nextValue)
                      .map((tag, index) => ({
                        tagId: tag.id,
                        minQuestionCount: 0,
                        maxQuestionCount: 0,
                        sortOrder: index,
                      })),
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="태그 그룹 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">설정 안 함</SelectItem>
                  {tagGroups.map((tagGroup) => (
                    <SelectItem key={tagGroup.id} value={tagGroup.id}>
                      {tagGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          name="mockExamBlueprintItems"
          control={control}
          render={({ field }) => {
            const rows = eraTags.map((tag, index) => {
              const item = field.value.find((value) => value.tagId === tag.id);
              return {
                tag,
                item: item ?? {
                  tagId: tag.id,
                  minQuestionCount: 0,
                  maxQuestionCount: 0,
                  sortOrder: index,
                },
              };
            });

            function updateCount(
              tagId: string,
              key: 'minQuestionCount' | 'maxQuestionCount',
              value: number,
            ) {
              const nextItems = rows.map(({ tag, item }, index) => ({
                ...item,
                tagId: tag.id,
                sortOrder: index,
                [key]: tag.id === tagId ? value : item[key],
              }));
              field.onChange(nextItems);
            }

            return (
              <div className="grid gap-2">
                <div className="grid grid-cols-[1fr_5rem_5rem] gap-2 text-xs text-muted-foreground">
                  <span>태그</span>
                  <span>최소</span>
                  <span>최대</span>
                </div>
                {rows.map(({ tag, item }) => (
                  <div
                    key={tag.id}
                    className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2"
                  >
                    <span className="text-sm">{tag.name}</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.minQuestionCount}
                      aria-label={`${tag.name} 최소 문항수`}
                      onChange={(event) =>
                        updateCount(
                          tag.id,
                          'minQuestionCount',
                          Number(event.target.value || 0),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={item.maxQuestionCount}
                      aria-label={`${tag.name} 최대 문항수`}
                      onChange={(event) =>
                        updateCount(
                          tag.id,
                          'maxQuestionCount',
                          Number(event.target.value || 0),
                        )
                      }
                    />
                  </div>
                ))}
                {eraTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    시대 태그 그룹을 선택하면 태그별 출제 범위를 입력할 수
                    있습니다.
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </Field>
  );
}

function TextField({
  control,
  name,
  label,
  placeholder,
}: {
  control: ReturnType<typeof useForm<ExamForm>>['control'];
  name: 'name' | 'slug';
  label: string;
  placeholder: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

function getExamFormValues(editingExam: AdminExamResponse | null): ExamForm {
  return {
    name: editingExam?.name ?? '',
    slug: editingExam?.slug ?? '',
    categoryIds: editingExam?.categories.map((category) => category.id) ?? [],
    usesMonth: editingExam?.usesMonth ?? false,
    usesRound: editingExam?.usesRound ?? false,
    mockExamQuestionCount: editingExam?.mockExamQuestionCount ?? null,
    eraTagGroupId: editingExam?.eraTagGroupId ?? null,
    mockExamBlueprintItems: editingExam?.mockExamBlueprintItems ?? [],
  };
}

function isAdminTag(value: unknown): value is AdminTagResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'examId' in value &&
    'tagGroupId' in value
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="
        flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2
        text-sm
      "
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
