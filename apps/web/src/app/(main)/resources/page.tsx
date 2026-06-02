import Link from 'next/link';

import { getExams } from '@/features/exams/api/server';
import { getPapersByExamId } from '@/features/papers/api/server';
import { PaperCover } from '@/features/papers/components/paper-cover-card';
import { PageContainer } from '@/shared/components/page-container';
import { cn } from '@/shared/lib/utils';

export default async function PapersPage() {
  let examsWithPapers: Array<{
    id: string;
    name: string;
    papers: Awaited<ReturnType<typeof getPapersByExamId>>;
  }>;
  try {
    const exams = await getExams();
    examsWithPapers = await Promise.all(
      exams.map(async (exam) => ({
        id: exam.id,
        name: exam.name,
        papers: await getPapersByExamId(exam.id),
      })),
    );
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900">자료실</h1>
        <p className="mt-3 text-sm text-destructive">
          학습자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  return (
    <PageContainer className="flex max-w-5xl flex-col">
      {examsWithPapers.length === 0 ? (
        <section className="px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">아직 등록된 시험이 없습니다.</p>
        </section>
      ) : (
        <div
          className="
            space-y-5
            sm:space-y-6
          "
        >
          {examsWithPapers.map((exam) => (
            <section
              key={exam.id}
              className={cn(
                `
                  overflow-hidden px-4
                  sm:p-7
                `,
              )}
            >
              <div
                className="
                  flex flex-col gap-4
                  sm:flex-row sm:items-start sm:justify-between
                "
              >
                <div className="min-w-0">
                  <h2 className="text-2xl">{exam.name}</h2>
                </div>
              </div>

              <ul
                className="
                  mt-6 grid grid-cols-2 gap-x-3 gap-y-7
                  sm:grid-cols-3 sm:gap-x-5
                  lg:grid-cols-4
                "
              >
                {exam.papers.map((paper) => (
                  <li key={paper.id} className="min-w-0">
                    <Link
                      href={`/resources/${paper.id}`}
                      className="group block rounded-[1.4rem] p-2 transition"
                      aria-label={`${paper.title} 자세히 보기`}
                    >
                      <PaperCover paper={paper} />
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-zinc-900">
                          {paper.title}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
