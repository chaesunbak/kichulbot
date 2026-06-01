import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@kichulbot/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { LibraryPaperActions } from '@/components/library-paper-actions';
import { PaperCoverCard } from '@/components/paper-cover-card';
import { getSolveSessionLogs, getBookshelves } from '@/lib/learning';
import { formatPaperSession } from '@/lib/paper-labels';

export default async function LibraryPaperPage({
  params,
}: {
  params: Promise<{ bookshelfId: string; paperId: string }>;
}) {
  const { bookshelfId, paperId } = await params;
  const [bookshelves, logs] = await Promise.all([
    getBookshelves(),
    getSolveSessionLogs(),
  ]);
  const bookshelf = bookshelves.find((item) => item.id === bookshelfId);
  const libraryPaper = bookshelf?.papers.find(
    (item) => item.paper.id === paperId,
  );
  if (!bookshelf || !libraryPaper) notFound();

  const paperLogs = logs.filter((log) => log.paper.id === paperId);
  const { paper } = libraryPaper;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <PaperCoverCard paper={paper} />
      </div>
      <p className="text-sm text-zinc-500">{bookshelf.name}</p>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        {paper.title}
      </h1>
      <p className="mt-3 text-sm text-zinc-500">
        {paper.exam.name} · {paper.subject.name} · {formatPaperSession(paper)} ·{' '}
        {paper.questionCount}문항
      </p>

      <LibraryPaperActions bookshelfId={bookshelf.id} paperId={paper.id} />

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
