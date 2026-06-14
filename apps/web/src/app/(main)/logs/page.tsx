import { Button } from '@kichulbot/ui/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getUser } from '@/features/auth/api/server/queries';
import { getSolveSessionLogPage } from '@/features/learning/api/server/queries';
import { CompactSolveSessionLogList } from '@/features/learning/components/compact-solve-session-log-list';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

const LOG_PAGE_SIZE = 10;

interface LogsPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const user = await getUser();
  const nextPath = page > 1 ? `/logs?page=${page}` : '/logs';
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const logPage = await getSolveSessionLogPage({
    status: 'all',
    page,
    limit: LOG_PAGE_SIZE,
  });
  const hasPrevious = logPage.page > 1;
  const hasNext = logPage.totalPages > logPage.page;

  return (
    <PageContainer>
      <PageTitle>내 풀이</PageTitle>

      <CompactSolveSessionLogList
        logs={logPage.logs}
        emptyMessage="아직 풀이 기록이 없습니다."
      />

      {logPage.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {hasPrevious ? (
            <Button asChild variant="outline">
              <Link href={`/logs?page=${logPage.page - 1}`}>
                <ChevronLeft className="size-4" />
                이전
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              <ChevronLeft className="size-4" />
              이전
            </Button>
          )}

          {hasNext ? (
            <Button asChild variant="outline">
              <Link href={`/logs?page=${logPage.page + 1}`}>
                다음
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              다음
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function normalizePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
