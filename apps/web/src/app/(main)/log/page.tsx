import { Button } from '@kichulbot/ui/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getSolveSessionLogPage } from '@/features/learning/api/server';
import { SolveSessionLogList } from '@/features/learning/components/solve-session-log-list';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

const LOG_PAGE_SIZE = 10;

interface LogPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export default async function LogPage({ searchParams }: LogPageProps) {
  const params = await searchParams;
  const page = normalizePage(params?.page);
  const user = await getCachedUser();
  const nextPath = page > 1 ? `/log?page=${page}` : '/log';
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const logPage = await getSolveSessionLogPage({
    status: 'completed',
    page,
    limit: LOG_PAGE_SIZE,
  });
  const hasPrevious = logPage.page > 1;
  const hasNext = logPage.totalPages > logPage.page;

  return (
    <PageContainer>
      <PageTitle>내 풀이</PageTitle>

      <SolveSessionLogList
        logs={logPage.logs}
        emptyMessage="종료한 풀이가 없습니다."
      />

      {logPage.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {hasPrevious ? (
            <Button asChild variant="outline">
              <Link href={`/log?page=${logPage.page - 1}`}>
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
              <Link href={`/log?page=${logPage.page + 1}`}>
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
