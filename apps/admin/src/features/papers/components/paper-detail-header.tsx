import { Button } from '@kichulbot/ui/components/ui/button';
import { Switch } from '@kichulbot/ui/components/ui/switch';
import { ArrowLeft, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { formatPaperSession } from '../lib/paper-metadata';
import type { UpdatePaperMetadataValues } from '../types';
import { UpdatePaperMetadataForm } from './update-paper-metadata-form';

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
        <UpdatePaperMetadataForm
          paper={paper}
          isUpdating={isUpdatingMetadata}
          onUpdateMetadata={onUpdateMetadata}
          onCancel={() => setIsEditingMetadata(false)}
          onUpdated={() => setIsEditingMetadata(false)}
        />
      )}
    </div>
  );
}
