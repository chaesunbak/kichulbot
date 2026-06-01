import Link from 'next/link';
import { ArrowRight, BookOpen, LibraryBig, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@kichulbot/ui/components/card';
import { getUser } from '@/lib/auth';
import { getAnswerSessionLogs, getBookshelves } from '@/lib/learning';

export default async function HomePage() {
  const [user, bookshelves, logs] = await Promise.all([
    getUser(),
    getBookshelves().catch(() => []),
    getAnswerSessionLogs().catch(() => []),
  ]);
  const savedPaperCount = bookshelves.reduce(
    (count, bookshelf) => count + bookshelf.papers.length,
    0,
  );
  const recentLog = logs[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <section className="rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-8">
        <p className="text-sm font-medium text-primary-foreground/75">
          오늘도 차근차근
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {user?.nickname ?? '학습자'}님, 무엇을 공부할까요?
        </h1>
        <Link
          href="/papers"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-white/90"
        >
          자료실 둘러보기
          <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">바로가기</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ShortcutCard
            href="/papers"
            icon={BookOpen}
            title="자료실"
            description="새로운 기출 자료 찾기"
          />
          <ShortcutCard
            href="/library"
            icon={LibraryBig}
            title="내책장"
            description={`${savedPaperCount}개 자료 보관 중`}
          />
          <ShortcutCard
            href="/recap"
            icon={RotateCcw}
            title="복습"
            description={`${logs.length}개의 풀이 기록`}
          />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">최근 학습</h2>
          <Link
            href="/recap"
            className="text-sm font-medium text-primary hover:underline"
          >
            전체 보기
          </Link>
        </div>
        <Card className="mt-4">
          <CardContent>
            {recentLog ? (
              <>
                <p className="font-medium text-zinc-900">
                  {recentLog.paper.title}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {recentLog.result.score}점 · {recentLog.result.correctCount}/
                  {recentLog.result.totalCount}문항 정답
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                아직 완료한 풀이가 없습니다. 자료실에서 첫 문제를 풀어보세요.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:bg-zinc-50">
        <CardContent>
          <Icon className="size-5 text-primary" />
          <p className="mt-4 font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
