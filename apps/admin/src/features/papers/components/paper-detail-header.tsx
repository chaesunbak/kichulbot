import { Button } from '@kichulbot/ui/components/button';
import { Switch } from '@kichulbot/ui/components/switch';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

export function PaperDetailHeader({
  paper,
  isUpdating,
  isDeleting,
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
  isDeleting: boolean;
  onPublishedChange: (isPublished: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="
        mb-5 flex flex-col gap-4
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
  );
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
