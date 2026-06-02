import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

import {
  formatDuration,
  formatRelativeDate,
  formatSolveMode,
} from '@/features/learning/lib/format';
import type { SolveSessionLog } from '@/features/learning/types';

type SolveSessionLogListProps = {
  logs: SolveSessionLog[];
  emptyMessage: string;
};

export function SolveSessionLogList({
  logs,
  emptyMessage,
}: SolveSessionLogListProps) {
  if (logs.length === 0) {
    return <div className="text-sm text-zinc-500">{emptyMessage}</div>;
  }

  return (
    <ul className="grid gap-4">
      {logs.map((log) => (
        <li key={log.id}>
          <Card>
            <CardHeader>
              <CardTitle>{log.paper.title}</CardTitle>
              <CardDescription>
                {formatSolveMode(log.mode)} ·{' '}
                {log.result
                  ? `${log.result.score}점 · ${log.result.correctCount}/${log.result.totalCount} 정답 · ${formatDuration(
                      log.result.totalSpentMilliseconds,
                    )}`
                  : `${formatDuration(log.totalSpentMilliseconds)} · 풀이 중`}{' '}
                · {formatRelativeDate(log.submittedAt ?? log.updatedAt)}
              </CardDescription>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 w-fit"
              >
                <Link
                  href={
                    log.submittedAt ? `/results/${log.id}` : `/solve/${log.id}`
                  }
                >
                  {log.submittedAt ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {log.submittedAt ? '결과 보기' : '이어 풀기'}
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}
