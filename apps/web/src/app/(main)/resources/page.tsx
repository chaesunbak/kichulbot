import Link from 'next/link';

import { getExams } from '@/features/exams/api/server';
import {
  BookshelfGrid,
  BookshelfSection,
} from '@/features/library/components/bookshelf-section';
import { getPapersByExamId } from '@/features/papers/api/server';
import { PaperCoverCard } from '@/features/papers/components/paper-cover-card';

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
  const totalPaperCount = examsWithPapers.reduce(
    (count, exam) => count + exam.papers.length,
    0,
  );

  return (
    <div
      className="
        mx-auto max-w-6xl px-4 py-8
        sm:py-10
      "
    >
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">자료실</h1>

      {examsWithPapers.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          아직 등록된 시험이 없습니다.
        </p>
      ) : (
        <BookshelfSection
          title="문제지 자료실"
          countLabel={`${totalPaperCount}권`}
        >
          <div className="divide-y divide-[#e5dacb]">
            {examsWithPapers.map((exam) => (
              <div
                key={exam.id}
                className="
                  px-3 py-6
                  sm:px-6
                "
              >
                <h2 className="text-lg font-bold text-zinc-900">{exam.name}</h2>
                {exam.papers.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">
                    등록된 시험지가 없습니다.
                  </p>
                ) : (
                  <BookshelfGrid className="mt-5 p-0">
                    {exam.papers.map((paper) => (
                      <li key={paper.id} className="min-w-0 px-1 pb-5">
                        <Link
                          href={`/resources/${paper.id}`}
                          className="block min-w-0 rounded-lg"
                          aria-label={`${paper.title} 자세히 보기`}
                        >
                          <PaperCoverCard paper={paper} />
                        </Link>
                      </li>
                    ))}
                  </BookshelfGrid>
                )}
              </div>
            ))}
          </div>
        </BookshelfSection>
      )}
    </div>
  );
}
