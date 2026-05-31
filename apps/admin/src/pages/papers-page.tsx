import { BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { Separator } from '@kichulbot/ui/components/separator';
import { CreatePaperForm } from '@/features/papers/components/create-paper-form';
import { PapersSummary } from '@/features/papers/components/papers-summary';
import { PapersTable } from '@/features/papers/components/papers-table';
import { papersQueryOptions } from '@/features/papers/queries';
import {
  examsQueryOptions,
  subjectsQueryOptions,
} from '@/features/reference-data/queries';
import { useAuthStore } from '@/features/auth/store';

export function PapersPage() {
  const token = useAuthStore((state) => state.token)!;
  const papers = useQuery(papersQueryOptions(token)).data?.papers ?? [];
  const exams = useQuery(examsQueryOptions(token)).data?.exams ?? [];
  const subjects = useQuery(subjectsQueryOptions(token)).data?.subjects ?? [];
  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <CreatePaperForm token={token} exams={exams} subjects={subjects} />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4" />
            문제지 목록
          </CardTitle>
          <CardDescription>
            등록된 문제지와 문항 등록 진행 상황을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PapersSummary papers={papers} />
          <Separator className="mb-4" />
          <PapersTable papers={papers} />
        </CardContent>
      </Card>
    </div>
  );
}
