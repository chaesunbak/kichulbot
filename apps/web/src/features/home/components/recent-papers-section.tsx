import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import type { SolveSessionLog } from '@/features/learning/types';
import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { formatPaperSession } from '@/features/papers/lib/paper-labels';

type RecentPapersSectionProps = {
  logs: SolveSessionLog[];
};

export function RecentPapersSection({ logs }: RecentPapersSectionProps) {
  const recentPapers = getRecentPapers(logs);

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <CardTitle>최근 본 문제지</CardTitle>
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
        <ul
          className="
            grid grid-cols-2 gap-x-3 gap-y-6
            sm:grid-cols-4 sm:gap-x-5
          "
        >
          {recentPapers.map((paper) => (
            <li key={paper.id} className="min-w-0">
              <Link
                href={`/resources/${paper.id}`}
                className="block"
                aria-label={`${paper.title} 자세히 보기`}
              >
                <PaperCover
                  paper={paper}
                  className="
                    max-w-32
                    sm:max-w-36
                  "
                />
                <span
                  className="
                    mt-2 line-clamp-2 text-sm font-semibold text-zinc-900
                  "
                >
                  {paper.title}
                </span>
                <span className="mt-1 truncate text-xs text-zinc-500">
                  {formatPaperSession(paper)} · {paper.questionCount}문항
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function getRecentPapers(logs: SolveSessionLog[]) {
  const paperById = new Map<string, SolveSessionLog['paper']>();

  for (const log of logs) {
    if (!paperById.has(log.paper.id)) {
      paperById.set(log.paper.id, log.paper);
    }
  }

  return [...paperById.values()].slice(0, 4);
}
