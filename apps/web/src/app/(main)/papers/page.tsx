import Link from 'next/link';
import {
  BookshelfGrid,
  BookshelfSection,
} from '@/components/bookshelf-section';
import { PaperCoverCard } from '@/components/paper-cover-card';
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
  const examGroups = groupPapers(papers);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="mt-1 text-2xl font-semibold text-zinc-900">자료실</h1>

      {papers.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          아직 등록된 문제지가 없습니다.
        </p>
      ) : (
        <BookshelfSection
          title="문제지 자료실"
          countLabel={`${papers.length}권`}
        >
          <div className="divide-y divide-[#e5dacb]">
            {examGroups.map((examGroup) => (
              <div key={examGroup.id} className="px-3 py-6 sm:px-6">
                <h2 className="text-lg font-bold text-zinc-900">
                  {examGroup.name}
                </h2>
                {examGroup.grades.map((gradeGroup) => (
                  <div key={gradeGroup.grade ?? 'all'} className="mt-5">
                    {gradeGroup.grade && (
                      <h3 className="mb-3 text-sm font-semibold">
                        고{gradeGroup.grade}
                      </h3>
                    )}
                    <BookshelfGrid className="px-0 py-0">
                      {gradeGroup.papers.map((paper) => (
                        <li key={paper.id} className="min-w-0 px-1 pb-5">
                          <Link
                            href={`/papers/${paper.id}`}
                            className="block min-w-0 rounded-lg"
                            aria-label={`${paper.title} 자세히 보기`}
                          >
                            <PaperCoverCard paper={paper} />
                          </Link>
                        </li>
                      ))}
                    </BookshelfGrid>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </BookshelfSection>
      )}
    </div>
  );
}

function groupPapers(papers: Paper[]) {
  const exams = new Map<
    string,
    { id: string; name: string; papers: Paper[] }
  >();
  for (const paper of papers) {
    const group = exams.get(paper.exam.id) ?? {
      id: paper.exam.id,
      name: paper.exam.name,
      papers: [],
    };
    group.papers.push(paper);
    exams.set(paper.exam.id, group);
  }

  return [...exams.values()].map(({ papers: examPapers, ...exam }) => {
    const grades = new Map<number | null, Paper[]>();
    for (const paper of examPapers) {
      const papers = grades.get(paper.grade) ?? [];
      papers.push(paper);
      grades.set(paper.grade, papers);
    }
    return {
      ...exam,
      grades: [...grades.entries()]
        .sort(([a], [b]) => (a ?? 0) - (b ?? 0))
        .map(([grade, papers]) => ({ grade, papers })),
    };
  });
}
