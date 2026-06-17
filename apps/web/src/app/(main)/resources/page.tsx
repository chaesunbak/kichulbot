import { Button } from '@kichulbot/ui/components/ui/button';
import { Input } from '@kichulbot/ui/components/ui/input';
import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';

import {
  type ExamPaperOverview,
  getPublicExamPaperOverviews,
} from '@/features/exams/api/server/queries';
import { PaperGrid } from '@/features/papers/components/paper-grid';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

const EXAM_PAPER_LIMIT = 4;

export default async function PapersPage() {
  let sections: ExamPaperOverview[];
  try {
    sections = await getPublicExamPaperOverviews(EXAM_PAPER_LIMIT);
  } catch {
    return (
      <PageContainer className="min-h-[calc(100svh-16rem)]">
        <PageTitle>자료실</PageTitle>
        <p className="mt-3 text-sm text-destructive">
          학습자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="min-h-[calc(100svh-16rem)]">
      <div
        className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        <PageTitle>자료실</PageTitle>
        <form
          action="/resources/search"
          className="
            flex min-w-0 gap-2
            sm:w-80
          "
        >
          <Input
            name="q"
            type="search"
            placeholder="검색어를 입력해주세요"
            className="h-10"
          />
          <Button type="submit" className="h-10 shrink-0">
            <Search className="size-4" />
            검색
          </Button>
        </form>
      </div>

      {sections.every((section) => section.paperCount === 0) ? (
        <section className="px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            아직 등록된 시험지가 없습니다.
          </p>
        </section>
      ) : (
        <div className="grid gap-12">
          {sections
            .filter((section) => section.paperCount > 0)
            .map((section) => (
              <ExamPaperSectionItem key={section.exam.id} section={section} />
            ))}
        </div>
      )}
    </PageContainer>
  );
}

type ExamPaperSectionItemProps = {
  section: ExamPaperOverview;
};

function ExamPaperSectionItem({ section }: ExamPaperSectionItemProps) {
  const { exam, paperCount, papers } = section;

  return (
    <section className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{exam.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {paperCount}개 시험지
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/resources/search?examId=${exam.id}`}>
            더보기
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
      <PaperGrid
        papers={papers}
        source="resources_exam_section"
        resultCount={paperCount}
      />
    </section>
  );
}
