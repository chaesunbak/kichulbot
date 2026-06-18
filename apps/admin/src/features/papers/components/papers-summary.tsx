import type { AdminPaper } from '@/shared/types';

export function PapersSummary({ papers }: { papers: AdminPaper[] }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Metric label="전체" value={papers.length} />
      <Metric
        label="공개"
        value={papers.filter((paper) => paper.isPublished).length}
      />
      <Metric
        label="문항"
        value={papers.reduce(
          (sum, paper) => sum + (paper.registeredQuestionCount ?? 0),
          0,
        )}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
