import { notFound, redirect } from 'next/navigation';

import { getCachedUser } from '@/features/auth/server';
import { getSolveSessionLogs } from '@/features/learning/api/server';
import { PaperSolveHistorySection } from '@/features/learning/components/paper-solve-history-section';
import type { LibraryFolder } from '@/features/learning/types';
import { getLibrary } from '@/features/library/api/server';
import { LibraryPaperActions } from '@/features/library/components/library-paper-actions';
import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { formatPaperSession } from '@/features/papers/lib/paper-labels';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function LibraryPaperPage({
  params,
}: {
  params: Promise<{ libraryPaperId: string }>;
}) {
  const { libraryPaperId } = await params;
  const user = await getCachedUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/library/papers/${libraryPaperId}`)}`,
    );
  }

  const [library, logs] = await Promise.all([
    getLibrary(),
    getSolveSessionLogs(),
  ]);
  const libraryPaper = library.papers.find(
    (item) => item.id === libraryPaperId,
  );
  if (!libraryPaper) notFound();

  const { paper } = libraryPaper;
  const folderLabel = getFolderPath(library.folders, libraryPaper.folderId);

  return (
    <PageContainer>
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
          <p className="text-sm text-zinc-500">{folderLabel}</p>
          <PageTitle>{paper.title}</PageTitle>
          <p className="mt-3 text-sm text-zinc-500">
            {paper.exam.name} · {formatPaperSession(paper)} ·{' '}
            {paper.questionCount}문항
          </p>

          <LibraryPaperActions
            libraryPaperId={libraryPaper.id}
            paperId={paper.id}
            folders={library.folders}
            initialFolderId={libraryPaper.folderId}
          />
        </div>
      </div>

      <PaperSolveHistorySection logs={logs} paperId={paper.id} />
    </PageContainer>
  );
}

function getFolderPath(folders: LibraryFolder[], folderId: string | null) {
  if (!folderId) return '루트';
  const names: string[] = [];
  let current = folders.find((folder) => folder.id === folderId);
  while (current) {
    names.unshift(current.name);
    current = folders.find((folder) => folder.id === current?.parentId);
  }
  return names.length > 0 ? names.join(' / ') : '루트';
}
