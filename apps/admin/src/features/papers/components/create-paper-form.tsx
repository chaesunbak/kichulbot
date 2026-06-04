import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
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
import { Plus } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import type { Exam } from '@/shared/types';

import { useCreatePaperMutation } from '../mutations';
import { paperSchema } from '../schemas';
import type { PaperValues } from '../types';

const defaults: PaperValues = {
  title: '',
  year: new Date().getFullYear(),
  examId: '',
  questionCount: 20,
  isPublished: 'false',
};

export function CreatePaperForm({
  token,
  exams,
}: {
  token: string;
  exams: Exam[];
}) {
  const form = useForm<PaperValues>({
    resolver: standardSchemaResolver(paperSchema),
    defaultValues: defaults,
  });
  const mutation = useCreatePaperMutation(token);
  const examId = useWatch({ control: form.control, name: 'examId' });
  const selectedExam = exams.find((exam) => exam.id === examId);
  const submit = form.handleSubmit((values) => {
    if (!selectedExam) return;
    mutation.mutate(
      { values, exam: selectedExam },
      {
        onSuccess: () =>
          form.reset({
            ...defaults,
            year: values.year,
            examId: values.examId,
          }),
      },
    );
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          문제지 등록
        </CardTitle>
        <CardDescription>
          시험 종류에 맞는 시행 정보와 문항 수를 저장합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <FieldGroup>
            <TextField
              control={form.control}
              name="title"
              label="문제지 제목"
              placeholder="2025학년도 수능 한국사"
            />
            <div
              className="
                grid gap-4
                sm:grid-cols-2
              "
            >
              <NumberField
                control={form.control}
                name="year"
                label="시행 연도"
              />
              <NumberField
                control={form.control}
                name="questionCount"
                label="문항 수"
              />
            </div>
            <SelectField
              control={form.control}
              name="examId"
              label="시험"
              items={exams}
            />
            {selectedExam?.usesMonth && (
              <NumberField
                control={form.control}
                name="month"
                label="시행 월"
                placeholder="3"
                required
              />
            )}
            {selectedExam?.usesGrade && (
              <NumberField
                control={form.control}
                name="grade"
                label="대상 학년"
                placeholder="1"
                required
              />
            )}
            {selectedExam?.usesRound && (
              <NumberField
                control={form.control}
                name="round"
                label="시험 회차"
                placeholder="75"
                required
              />
            )}
            <Controller
              name="isPublished"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>공개 상태</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">비공개</SelectItem>
                      <SelectItem value="true">공개</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    공개 문제지는 사용자 목록에 노출됩니다.
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            <Plus className="size-4" />
            문제지 생성
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type Control = ReturnType<typeof useForm<PaperValues>>['control'];
function TextField({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control;
  name: 'title';
  label: string;
  placeholder: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Input {...field} placeholder={placeholder} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
function NumberField({
  control,
  name,
  label,
  placeholder,
  required,
}: {
  control: Control;
  name: 'year' | 'month' | 'grade' | 'round' | 'questionCount';
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Input
            type="number"
            value={field.value ?? ''}
            placeholder={placeholder}
            required={required}
            onChange={(event) =>
              field.onChange(
                event.target.value === ''
                  ? undefined
                  : Number(event.target.value),
              )
            }
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
function SelectField({
  control,
  name,
  label,
  items,
}: {
  control: Control;
  name: 'examId';
  label: string;
  items: Exam[];
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`${label} 선택`} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
