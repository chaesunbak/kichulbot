import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSolveSessionLogs } from '@/features/learning/api/server';
import type { LibraryFolder } from '@/features/learning/types';
import { getLibrary } from '@/features/library/api/server';
import { LibraryPaperActions } from '@/features/library/components/library-paper-actions';
import { PaperCover } from '@/features/papers/components/paper-cover-card';
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
  const paperOnlyLogs = logs.filter((log) => log.paper.id === paper.id);
  const attemptNumbers = new Map(
    [...paperOnlyLogs]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((log, index) => [log.id, index + 1]),
  );
  const paperLogs = paperOnlyLogs.map((log) => ({
    log,
    attemptNumber: attemptNumbers.get(log.id) ?? 1,
  }));
  const folderLabel = getFolderPath(library.folders, libraryPaper.folderId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <PaperCover paper={paper} />
      </div>
      <p className="text-sm text-zinc-500">{folderLabel}</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {paper.title}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {paper.exam.name} · {formatPaperSession(paper)} · {paper.questionCount}
        문항
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
            아직 풀이 기록이 없습니다.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
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
                          {formatRelativeDate(log.submittedAt ?? log.updatedAt)}{' '}
                          · {log.submittedAt ? '풀이 완료' : '풀이 중'}
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

function formatRelativeDate(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return '방금 전';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  return `${Math.floor(diffMs / day)}일 전`;
}
