import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@kichulbot/ui/components/ui/field';
import { Input } from '@kichulbot/ui/components/ui/input';
import { Switch } from '@kichulbot/ui/components/ui/switch';
import { ArrowLeft, Check, Pencil, Trash2, X } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';

import { updatePaperMetadataSchema } from '../schemas';
import type { UpdatePaperMetadataValues } from '../types';

export function PaperDetailHeader({
  paper,
  isUpdating,
  isUpdatingMetadata,
  isDeleting,
  onUpdateMetadata,
  onPublishedChange,
  onDelete,
}: {
  paper: {
    title: string;
    year: number;
    month: number | null;
    grade: number | null;
    round: number | null;
    isPublished: boolean;
    exam: { name: string };
  };
  isUpdating: boolean;
  isUpdatingMetadata: boolean;
  isDeleting: boolean;
  onUpdateMetadata: (
    values: UpdatePaperMetadataValues,
    options: { onSuccess: () => void },
  ) => void;
  onPublishedChange: (isPublished: boolean) => void;
  onDelete: () => void;
}) {
  const [isEditingMetadata, setIsEditingMetadata] = React.useState(false);
  const form = useForm<UpdatePaperMetadataValues>({
    resolver: standardSchemaResolver(updatePaperMetadataSchema),
    defaultValues: toMetadataValues(paper),
  });
  const hasRound = paper.round !== null;

  React.useEffect(() => {
    form.reset(toMetadataValues(paper));
  }, [form, paper]);

  const submit = form.handleSubmit((values) => {
    onUpdateMetadata(
      {
        title: values.title,
        year: values.year,
        ...(hasRound ? { round: values.round } : {}),
      },
      { onSuccess: () => setIsEditingMetadata(false) },
    );
  });

  return (
    <div
      className="
        mb-5 space-y-4
      "
    >
      <div
        className="
          flex flex-col gap-4
          sm:flex-row sm:items-end sm:justify-between
        "
      >
        <div>
          <Button asChild className="mb-2 -ml-3" variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="size-4" />
              문제지 목록
            </Link>
          </Button>
          <h2 className="text-2xl font-semibold">{paper.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPaperSession(paper)} · {paper.exam.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={isUpdatingMetadata}
            onClick={() => setIsEditingMetadata((value) => !value)}
          >
            {isEditingMetadata ? (
              <X className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
            {isEditingMetadata ? '닫기' : '정보 수정'}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={paper.isPublished}
              disabled={isUpdating}
              onCheckedChange={onPublishedChange}
            />
            <span>{paper.isPublished ? '공개' : '비공개'}</span>
          </label>
          <Button
            variant="destructive"
            size="sm"
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            문제지 삭제
          </Button>
        </div>
      </div>

      {isEditingMetadata && (
        <form
          className="
            rounded-md border bg-background p-4
          "
          onSubmit={submit}
        >
          <FieldGroup>
            <div
              className="
                grid gap-3
                md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]
              "
            >
              <TextField
                control={form.control}
                name="title"
                label="문제지 제목"
              />
              <NumberField
                control={form.control}
                name="year"
                label="시행연도"
              />
              {hasRound && (
                <NumberField control={form.control} name="round" label="회차" />
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingMetadata}
                onClick={() => {
                  form.reset(toMetadataValues(paper));
                  setIsEditingMetadata(false);
                }}
              >
                취소
              </Button>
              <Button type="submit" disabled={isUpdatingMetadata}>
                <Check className="size-4" />
                저장
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}

type Control = ReturnType<typeof useForm<UpdatePaperMetadataValues>>['control'];

function TextField({
  control,
  name,
  label,
}: {
  control: Control;
  name: 'title';
  label: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>{label}</FieldLabel>
          <Input {...field} />
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
  name: 'year' | 'round';
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
            value={field.value ?? ''}
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

function toMetadataValues(paper: {
  title: string;
  year: number;
  round: number | null;
}): UpdatePaperMetadataValues {
  return {
    title: paper.title,
    year: paper.year,
    round: paper.round ?? undefined,
  };
}

function formatPaperSession(paper: {
  year: number;
  month: number | null;
  grade: number | null;
  round: number | null;
}) {
  if (paper.round) return `제${paper.round}회`;
  const year = paper.month
    ? `${paper.year}년 ${paper.month}월`
    : `${paper.year}학년도`;
  return paper.grade ? `${year} 고${paper.grade}` : year;
}
