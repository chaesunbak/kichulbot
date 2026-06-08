import {
  Field,
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
import type { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { Exam } from '@/shared/types';

import type { ImportPaperValues } from '../types';

export function ImportPaperFields({
  control,
  exams,
  selectedExam,
}: {
  control: ReturnType<typeof useForm<ImportPaperValues>>['control'];
  exams: Exam[];
  selectedExam?: Exam;
}) {
  return (
    <FieldGroup>
      <TextField
        control={control}
        name="title"
        label="문제지 제목"
        placeholder="78회 한국사 심화"
      />
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <NumberField control={control} name="year" label="시행 연도" />
        <NumberField control={control} name="questionCount" label="문항 수" />
      </div>
      <Controller
        name="examId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>시험</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                className="w-full"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="시험 선택" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {selectedExam?.usesMonth && (
        <NumberField control={control} name="month" label="시행 월" />
      )}
      {selectedExam?.usesGrade && (
        <NumberField control={control} name="grade" label="대상 학년" />
      )}
      {selectedExam?.usesRound && (
        <NumberField control={control} name="round" label="시험 회차" />
      )}
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <SelectField
          control={control}
          name="layout"
          label="문제지 형식"
          items={[
            { value: 'korean-history', label: '한능검 심화' },
            { value: 'csat', label: '수능 2단형' },
          ]}
        />
        <SelectField
          control={control}
          name="variant"
          label="홀짝"
          items={[
            { value: 'odd', label: '홀수형' },
            { value: 'even', label: '짝수형' },
            { value: 'both', label: '둘 다' },
          ]}
        />
      </div>
      <FileField control={control} name="questionPdf" label="문제 PDF" />
      <FileField control={control} name="answerPdf" label="답지 PDF" />
    </FieldGroup>
  );
}

type Control = ReturnType<typeof useForm<ImportPaperValues>>['control'];

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

function NumberField({
  control,
  name,
  label,
}: {
  control: Control;
  name: 'year' | 'month' | 'grade' | 'round' | 'questionCount';
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
            type="number"
            inputMode="numeric"
            value={field.value ?? ''}
            onBlur={field.onBlur}
            ref={field.ref}
            aria-invalid={fieldState.invalid}
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
  name: 'layout' | 'variant';
  label: string;
  items: Array<{ value: string; label: string }>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
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

function FileField({
  control,
  name,
  label,
}: {
  control: Control;
  name: 'questionPdf' | 'answerPdf';
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, ref, ...field }, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            name={field.name}
            ref={ref}
            type="file"
            accept="application/pdf"
            aria-invalid={fieldState.invalid}
            onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
