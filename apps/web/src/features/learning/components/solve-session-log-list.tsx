import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

import {
  formatSolveSessionLogDetailMeta,
  getSolveSessionLogHref,
} from '@/features/learning/lib/solve-session-log';
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
                {formatSolveSessionLogDetailMeta(log)}
              </CardDescription>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 w-fit"
              >
                <Link href={getSolveSessionLogHref(log)}>
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
