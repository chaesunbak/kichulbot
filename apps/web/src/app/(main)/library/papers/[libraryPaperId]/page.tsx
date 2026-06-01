import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { LibraryPaperActions } from '@/features/library/components/library-paper-actions';
import { PaperCoverCard } from '@/features/papers/components/paper-cover-card';
import { getLibrary } from '@/features/library/api/server';
import { getSolveSessionLogs } from '@/features/learning/api/server';
import type { LibraryFolder } from '@/features/learning/types';
import { formatPaperSession } from '@/features/papers/lib/paper-labels';

export default async function LibraryPaperPage({
  params,
}: {
  params: Promise<{ libraryPaperId: string }>;
}) {
  const { libraryPaperId } = await params;
  const [library, logs] = await Promise.all([
    getLibrary(),
    getSolveSessionLogs(),
  ]);
  const libraryPaper = library.papers.find(
    (item) => item.id === libraryPaperId,
  );
  if (!libraryPaper) notFound();

  const { paper } = libraryPaper;
  const paperLogs = logs.filter((log) => log.paper.id === paper.id);
  const folderLabel = getFolderPath(library.folders, libraryPaper.folderId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <PaperCoverCard paper={paper} />
      </div>
      <p className="text-sm text-zinc-500">{folderLabel}</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {paper.title}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {paper.exam.name} · {paper.subject.name} · {formatPaperSession(paper)} ·{' '}
        {paper.questionCount}문항
      </p>

      <LibraryPaperActions
        libraryPaperId={libraryPaper.id}
        paperId={paper.id}
        folders={library.folders}
        initialFolderId={libraryPaper.folderId}
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">풀이 기록</h2>
        {paperLogs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            아직 완료한 풀이가 없습니다.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {paperLogs.map((log) => (
              <li key={log.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {log.mode === 'ONE_BY_ONE'
                        ? '한 문제씩 풀기'
                        : '한번에 풀기'}
                    </CardTitle>
                    <CardDescription>
                      {log.result.score}점 · {log.result.correctCount}/
                      {log.result.totalCount} 정답 ·{' '}
                      {formatDuration(log.result.totalSpentMilliseconds)} ·{' '}
                      {formatDate(log.submittedAt)}
                    </CardDescription>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-fit"
                    >
                      <Link href={`/results/${log.id}`}>결과 보기</Link>
                    </Button>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
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

function formatDuration(milliseconds: number) {
  const seconds = Math.round(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
