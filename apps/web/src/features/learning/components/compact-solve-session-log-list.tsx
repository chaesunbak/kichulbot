import { Progress } from '@kichulbot/ui/components/ui/progress';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  formatSolveSessionLogCompactMeta,
  getSolveSessionLogActionLabel,
  getSolveSessionLogHref,
} from '@/features/learning/lib/solve-session-log';
import type { SolveSessionLog } from '@/features/learning/types';

type CompactSolveSessionLogListProps = {
  logs: SolveSessionLog[];
  emptyMessage: string;
};

export function CompactSolveSessionLogList({
  logs,
  emptyMessage,
}: CompactSolveSessionLogListProps) {
  if (logs.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <ul className="grid gap-3">
      {logs.map((log) => (
        <CompactSolveSessionLogItem key={log.id} log={log} />
      ))}
    </ul>
  );
}

type CompactSolveSessionLogItemProps = {
  log: SolveSessionLog;
};

export function CompactSolveSessionLogItem({
  log,
}: CompactSolveSessionLogItemProps) {
  return (
    <li>
      <Link
        href={getSolveSessionLogHref(log)}
        className="
          block rounded-lg border p-4
          transition-colors hover:bg-muted
        "
        aria-label={`${log.paper.title} 학습 기록 보기`}
      >
        <div
          className="
            grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4
            sm:gap-x-6
          "
        >
          <div className="min-w-0 pt-1">
            <div className="line-clamp-1 text-sm font-semibold text-foreground">
              {log.paper.title}
            </div>
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {formatSolveSessionLogCompactMeta(log)}
            </div>
          </div>
          <div
            className="
              inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5
              text-xs font-semibold text-muted-foreground
            "
          >
            {getSolveSessionLogActionLabel(log)}
            <ChevronRight className="size-4" />
          </div>
          <div
            className="
              col-span-2 ml-auto flex w-full max-w-72 items-center gap-3
              sm:max-w-96
            "
          >
            <Progress value={log.progress.percent} className="h-2 min-w-0" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {log.progress.percent}%
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
