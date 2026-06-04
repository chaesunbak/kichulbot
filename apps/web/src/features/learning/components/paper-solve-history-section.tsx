import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import Link from 'next/link';

import {
  formatDuration,
  formatRelativeDate,
} from '@/features/learning/lib/format';
import type { SolveSessionLog } from '@/features/learning/types';
import { SectionTitle } from '@/shared/components/section-title';

type PaperSolveHistorySectionProps = {
  logs: SolveSessionLog[];
  paperId: string;
};

export function PaperSolveHistorySection({
  logs,
  paperId,
}: PaperSolveHistorySectionProps) {
  const paperLogs = getPaperLogs(logs, paperId);

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>풀이 기록</SectionTitle>
      {paperLogs.length === 0 ? (
        <span className="text-sm text-zinc-500">
          아직 풀이 기록이 없습니다.
        </span>
      ) : (
        <ul className="grid gap-3">
          {paperLogs.map(({ log, attemptNumber }) => (
            <li key={log.id}>
              <Card>
                <CardHeader className="gap-3">
                  <div
                    className="
                      flex flex-col gap-3
                      sm:flex-row sm:items-start sm:justify-between
                    "
                  >
                    <div>
                      <CardTitle className="text-base">
                        {attemptNumber}회차
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {formatDuration(log.totalSpentMilliseconds)} ·{' '}
                        {formatRelativeDate(log.submittedAt ?? log.updatedAt)} ·{' '}
                        {log.submittedAt ? '풀이 완료' : '풀이 중'}
                      </CardDescription>
                      {log.result && (
                        <p className="mt-1 text-sm text-zinc-500">
                          {log.result.score}점 · {log.result.correctCount}/
                          {log.result.totalCount} 정답
                        </p>
                      )}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-fit"
                    >
                      <Link
                        href={
                          log.submittedAt
                            ? `/results/${log.id}`
                            : `/solve/${log.id}`
                        }
                      >
                        {log.submittedAt ? '결과 보기' : '이어 풀기'}
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getPaperLogs(logs: SolveSessionLog[], paperId: string) {
  const paperOnlyLogs = logs.filter((log) => log.paper.id === paperId);
  const attemptNumbers = new Map(
    [...paperOnlyLogs]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((log, index) => [log.id, index + 1]),
  );

  return paperOnlyLogs.map((log) => ({
    log,
    attemptNumber: attemptNumbers.get(log.id) ?? 1,
  }));
}
