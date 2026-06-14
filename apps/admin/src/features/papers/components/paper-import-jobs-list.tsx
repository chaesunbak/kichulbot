import type { ListPaperImportJobsResponse } from '@kichulbot/api-contract/papers';
import { Badge } from '@kichulbot/ui/components/ui/badge';
import { Button } from '@kichulbot/ui/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router';

import { formatJobTime, paperImportJobStatusLabels } from '../lib/import-job';

type PaperImportJob = ListPaperImportJobsResponse['jobs'][number];

export function PaperImportJobsList({
  jobs,
  isFetching,
  onRefresh,
}: {
  jobs: PaperImportJob[];
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">최근 PDF 가져오기 작업</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            완료된 작업은 문제지 목록에 표시됩니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="작업 새로고침"
        >
          <RefreshCw
            className={isFetching ? 'size-4 animate-spin' : 'size-4'}
          />
        </Button>
      </div>
      <div className="divide-y">
        {jobs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            아직 PDF 가져오기 작업이 없습니다.
          </div>
        ) : (
          jobs.map((job) => <PaperImportJobRow key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}

function PaperImportJobRow({ job }: { job: PaperImportJob }) {
  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={job.status === 'FAILED' ? 'destructive' : 'secondary'}
          >
            {paperImportJobStatusLabels[job.status]}
          </Badge>
          <p className="truncate text-sm font-medium">
            {job.paperTitle || job.questionPdfName || 'PDF 가져오기 작업'}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatJobTime(job)}
        </p>
        {job.errorMessage ? (
          <p className="mt-2 text-sm wrap-break-word text-destructive">
            {job.errorMessage}
          </p>
        ) : null}
      </div>
      {job.status === 'COMPLETED' && job.paperId ? (
        <Button asChild variant="outline" size="sm">
          <Link to={`/papers/${job.paperId}`}>문제지 열기</Link>
        </Button>
      ) : null}
    </div>
  );
}
