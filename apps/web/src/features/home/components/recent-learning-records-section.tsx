import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Progress } from '@kichulbot/ui/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  formatRelativeDate,
  formatSolveMode,
} from '@/features/learning/lib/format';
import type { SolveSessionLog } from '@/features/learning/types';

type RecentLearningRecordsSectionProps = {
  logs: SolveSessionLog[];
};

export function RecentLearningRecordsSection({
  logs,
}: RecentLearningRecordsSectionProps) {
  const recentLogs = logs.slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <CardTitle>최근 학습 기록</CardTitle>
        <CardAction>
          <Button asChild variant="link">
            <Link href="/recap" aria-label="풀이 기록으로 이동">
              더보기
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <span className="text-sm text-zinc-500">
            아직 학습 기록이 없어요.
          </span>
        ) : (
          <ul className="grid gap-3">
            {recentLogs.map((log) => (
              <RecentLearningRecordItem key={log.id} log={log} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

type RecentLearningRecordItemProps = {
  log: SolveSessionLog;
};

function RecentLearningRecordItem({ log }: RecentLearningRecordItemProps) {
  const isSubmitted = !!log.submittedAt;
  const href = isSubmitted ? `/results/${log.id}` : `/solve/${log.id}`;
  const actionLabel = isSubmitted ? '결과 보기' : '이어 풀기';

  return (
    <li>
      <Link
        href={href}
        className="
          block rounded-md border p-4
          transition-colors hover:bg-zinc-50
        "
        aria-label={`${log.paper.title} 학습 기록 보기`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="line-clamp-1 text-sm font-semibold text-zinc-900">
              {log.paper.title}
            </div>
            <div className="mt-1 truncate text-xs text-zinc-500">
              {formatSolveMode(log.mode)} ·{' '}
              {formatRelativeDate(log.submittedAt ?? log.updatedAt)}
            </div>
          </div>
          <div className="flex flex-col">
            <div
              className="
              inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5
              text-xs font-semibold text-zinc-700
            "
            >
              {actionLabel}
              <ChevronRight className="size-4" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Progress value={log.progress.percent} className="h-2 flex-1" />
              <span className="shrink-0 text-xs text-zinc-500">
                {log.progress.percent}%
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
