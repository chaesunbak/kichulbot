import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
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
import { Plus } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { examFormSchema } from '@/features/reference-data/schemas';
import type { ExamForm } from '@/features/reference-data/types';

export interface ExamFormPanelProps {
  categories: AdminTaxonomyResponse[];
  editingExam: AdminExamResponse | null;
  isSubmitting: boolean;
  onSubmit: (values: ExamForm) => void;
  onCancel: () => void;
}

export function ExamFormPanel({
  categories,
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
  };
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
