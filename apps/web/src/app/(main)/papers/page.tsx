import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import Link from 'next/link';
import { getPapers, type Paper } from '@/lib/papers';

export default async function PapersPage() {
  let papers: Paper[];
  try {
    papers = await getPapers();
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">자료실</h1>
        <p className="mt-3 text-sm text-destructive">
          문제지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-sm font-medium text-primary">자료실</p>
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
        기출 자료 찾기
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        원하는 자료를 골라 바로 풀이를 시작하세요.
      </p>

      {papers.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          아직 등록된 문제지가 없습니다.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {papers.map((paper) => (
            <li key={paper.id}>
              <Link href={`/papers/${paper.id}`} className="block">
                <Card className="transition hover:bg-zinc-50">
                  <CardHeader>
                    <CardTitle>{paper.title}</CardTitle>
                    <CardDescription>
                      {paper.exam.name} · {paper.subject.name} · {paper.year}
                      학년도 · {paper.questionCount}문항
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
