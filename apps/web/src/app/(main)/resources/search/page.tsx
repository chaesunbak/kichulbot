import { getCategories, getExams } from '@/features/exams/api/server';
import { getPapers } from '@/features/papers/api/server';
import { PaperGrid } from '@/features/papers/components/paper-grid';
import { ResourceSearchControls } from '@/features/papers/components/resource-search-controls';
import { loadResourceSearchParams } from '@/features/papers/lib/resource-search-params';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

type ResourcesSearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResourcesSearchPage({
  searchParams,
}: ResourcesSearchPageProps) {
  const filters = await loadResourceSearchParams(searchParams);

  let data: {
    categories: Awaited<ReturnType<typeof getCategories>>;
    exams: Awaited<ReturnType<typeof getExams>>;
    papers: Awaited<ReturnType<typeof getPapers>>;
  };

  try {
    const [categories, exams, papers] = await Promise.all([
      getCategories(),
      getExams(),
      getPapers({
        categoryId: filters.categoryId,
        examId: filters.examId,
        q: filters.q,
      }),
    ]);
    data = { categories, exams, papers };
  } catch {
    return (
      <PageContainer>
        <PageTitle>시험지 검색</PageTitle>
        <p className="mt-3 text-sm text-destructive">
          검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div
        className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        <PageTitle>시험지 검색</PageTitle>
      </div>

      <ResourceSearchControls categories={data.categories} exams={data.exams} />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          검색 결과 {data.papers.length}개
        </p>
      </div>

      <PaperGrid
        papers={data.papers}
        source="resources_search"
        resultCount={data.papers.length}
      />
    </PageContainer>
  );
}
