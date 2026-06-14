import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import { FieldGroup } from '@kichulbot/ui/components/ui/field';
import { Switch } from '@kichulbot/ui/components/ui/switch';
import { ArrowLeft, Check, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';

import { NumberField, TextField } from '@/shared/components/form-fields';

import { formatPaperSession, toMetadataValues } from '../lib/paper-metadata';
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
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const form = useForm<UpdatePaperMetadataValues>({
    resolver: standardSchemaResolver(updatePaperMetadataSchema),
    defaultValues: toMetadataValues(paper),
  });
  const { reset } = form;
  const hasRound = paper.round !== null;

  useEffect(() => {
    reset(toMetadataValues(paper));
  }, [paper, reset]);

  const submit = form.handleSubmit((values) => {
    onUpdateMetadata(
      {
        title: values.title,
        year: values.year,
        ...(hasRound ? { round: values.round ?? undefined } : {}),
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
                  reset(toMetadataValues(paper));
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
