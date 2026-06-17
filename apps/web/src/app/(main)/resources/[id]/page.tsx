import { notFound } from 'next/navigation';

import { isUnauthorizedError } from '@/features/auth/lib/auth-redirect';
import { auth } from '@/features/auth/lib/server-auth';
import { getSolveSessionLogs } from '@/features/learning/api/server/queries';
import { PaperSolveHistorySection } from '@/features/learning/components/paper-solve-history-section';
import {
  getPublicPaper,
  type Paper,
} from '@/features/papers/api/server/queries';
import { PaperActions } from '@/features/papers/components/paper-actions';
import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { PaperViewTracker } from '@/features/papers/components/paper-view-tracker';
import { formatPaperSession } from '@/features/papers/lib/paper-labels';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let paper: Paper;
  try {
    paper = await getPublicPaper(id);
  } catch {
    notFound();
  }
  const [logs, token] = await Promise.all([
    getSolveSessionLogs().catch((error) => {
      if (isUnauthorizedError(error)) return [];
      throw error;
    }),
    auth(),
  ]);

  return (
    <PageContainer>
      <PaperViewTracker paperId={paper.id} />
      <div
        className="
          grid gap-8
          md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-start
        "
      >
        <div className="md:sticky md:top-10">
          <PaperCover paper={paper} />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{paper.exam.name}</div>
          <PageTitle>{paper.title}</PageTitle>
          <div className="text-sm text-muted-foreground">
            {formatPaperSession(paper)} · {paper.questionCount}문항
          </div>
          <PaperActions
            paperId={paper.id}
            questionCount={paper.questionCount}
            initialIsInLibrary={paper.isInLibrary}
            isAuthenticated={!!token}
          />
        </div>
      </div>
      <PaperSolveHistorySection logs={logs} paperId={paper.id} />
    </PageContainer>
  );
}
