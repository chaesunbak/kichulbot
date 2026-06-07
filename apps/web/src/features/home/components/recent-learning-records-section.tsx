import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { CompactSolveSessionLogItem } from '@/features/learning/components/compact-solve-session-log-list';
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
          <span className="text-sm text-muted-foreground">
            아직 학습 기록이 없어요.
          </span>
        ) : (
          <ul className="grid gap-3">
            {recentLogs.map((log) => (
              <CompactSolveSessionLogItem key={log.id} log={log} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
