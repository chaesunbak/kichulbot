import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Button } from '@kichulbot/ui/components/ui/button';
import { FieldGroup } from '@kichulbot/ui/components/ui/field';
import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { NumberField, TextField } from '@/shared/components/form-fields';

import { toMetadataValues } from '../lib/paper-metadata';
import { updatePaperMetadataSchema } from '../schemas';
import type { UpdatePaperMetadataValues } from '../types';

interface PaperMetadataFormPaper {
  title: string;
  year: number;
  round: number | null;
}

export function UpdatePaperMetadataForm({
  paper,
  isUpdating,
  onUpdateMetadata,
  onCancel,
  onUpdated,
}: {
  paper: PaperMetadataFormPaper;
  isUpdating: boolean;
  onUpdateMetadata: (
    values: UpdatePaperMetadataValues,
    options: { onSuccess: () => void },
  ) => void;
  onCancel: () => void;
  onUpdated: () => void;
}) {
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
      { onSuccess: onUpdated },
    );
  });

  return (
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
          <TextField control={form.control} name="title" label="문제지 제목" />
          <NumberField control={form.control} name="year" label="시행연도" />
          {hasRound && (
            <NumberField control={form.control} name="round" label="회차" />
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isUpdating}
            onClick={() => {
              reset(toMetadataValues(paper));
              onCancel();
            }}
          >
            취소
          </Button>
          <Button type="submit" disabled={isUpdating}>
            <Check className="size-4" />
            저장
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
