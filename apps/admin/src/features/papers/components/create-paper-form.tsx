import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/field';
import { Input } from '@kichulbot/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kichulbot/ui/components/select';
import type { Taxonomy } from '@/shared/api/api-client';
import { useCreatePaperMutation } from '../mutations';
import { paperSchema, type PaperValues } from '../schemas';

const defaults: PaperValues = {
  title: '',
  year: new Date().getFullYear(),
  examId: '',
  subjectId: '',
  questionCount: 20,
  isPublished: 'false',
};

export function CreatePaperForm({
  token,
  exams,
  subjects,
}: {
  token: string;
  exams: Taxonomy[];
  subjects: Taxonomy[];
}) {
  const form = useForm<PaperValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: defaults,
  });
  const mutation = useCreatePaperMutation(token);
  const submit = form.handleSubmit((values) =>
    mutation.mutate(values, {
      onSuccess: () =>
        form.reset({
          ...defaults,
          year: values.year,
          examId: values.examId,
          subjectId: values.subjectId,
        }),
    }),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          문제지 등록
        </CardTitle>
        <CardDescription>
          시험, 과목, 연도와 문항 수를 저장합니다.
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
            <div className="grid gap-4 sm:grid-cols-2">
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
            <SelectField
              control={form.control}
              name="subjectId"
              label="과목"
              items={subjects}
            />
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
          <Button className="w-full" disabled={mutation.isPending}>
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
}: {
  control: Control;
  name: 'year' | 'questionCount';
  label: string;
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
            value={field.value}
            onChange={(event) => field.onChange(Number(event.target.value))}
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
  name: 'examId' | 'subjectId';
  label: string;
  items: Taxonomy[];
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
