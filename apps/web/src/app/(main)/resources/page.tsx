import { Button } from '@kichulbot/ui/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Search } from 'lucide-react';
import Link from 'next/link';

import {
  type Category,
  type Exam,
  getCategories,
  getExams,
} from '@/features/exams/api/server';
import { PageContainer } from '@/shared/components/page-container';
import { PageTitle } from '@/shared/components/page-title';

export default async function PapersPage() {
  let categories: Awaited<ReturnType<typeof getCategories>>;
  let exams: Awaited<ReturnType<typeof getExams>>;
  try {
    [categories, exams] = await Promise.all([getCategories(), getExams()]);
  } catch {
    return (
      <PageContainer>
        <PageTitle>자료실</PageTitle>
        <p className="mt-3 text-sm text-destructive">
          학습자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
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
        <PageTitle>자료실</PageTitle>
        <Button asChild variant="outline">
          <Link href="/resources/search">
            <Search className="size-4" />
            시험지 검색
          </Link>
        </Button>
      </div>

      {categories.length === 0 && exams.length === 0 ? (
        <section className="px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">아직 등록된 시험이 없습니다.</p>
        </section>
      ) : (
        <div
          className="
            grid gap-4
            sm:grid-cols-2
          "
        >
          {categories.map((category) => (
            <CategoryCardItem
              key={category.id}
              category={category}
              exams={exams.filter((exam) =>
                exam.categories.some((item) => item.id === category.id),
              )}
            />
          ))}

          {categories.length === 0 &&
            exams.map((exam) => (
              <Card key={exam.id} size="sm">
                <CardHeader className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{exam.name}</CardTitle>
                  </div>
                  <CardAction>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/resources/search?examId=${exam.id}`}>
                        보기
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
              </Card>
            ))}
        </div>
      )}
    </PageContainer>
  );
}

type CategoryCardItemProps = {
  category: Category;
  exams: Exam[];
};

function CategoryCardItem({ category, exams }: CategoryCardItemProps) {
  return (
    <Card size="sm">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{category.name}</CardTitle>
          <p className="mt-1 text-sm text-zinc-500">{exams.length}개 시험</p>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href={`/resources/search?categoryId=${category.id}`}>
              보기
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      {exams.length > 0 && (
        <CardContent className="flex flex-wrap gap-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={`/resources/search?examId=${exam.id}`}
              className="
                rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700
                transition
                hover:bg-zinc-200
              "
            >
              {exam.name}
            </Link>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
