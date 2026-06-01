import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/card';
import { Separator } from '@kichulbot/ui/components/separator';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';

import { useAuthStore } from '@/features/auth/store';
import { CreatePaperForm } from '@/features/papers/components/create-paper-form';
import { PapersSummary } from '@/features/papers/components/papers-summary';
import { PapersTable } from '@/features/papers/components/papers-table';
import { papersQueryOptions } from '@/features/papers/queries';
import { examsQueryOptions } from '@/features/reference-data/queries';

export function PapersPage() {
  const token = useAuthStore((state) => state.token)!;
  const papers = useQuery(papersQueryOptions(token)).data?.papers ?? [];
  const exams = useQuery(examsQueryOptions(token)).data?.exams ?? [];
  return (
    <div
      className="
        mx-auto grid max-w-7xl gap-5 px-5 py-6
        lg:grid-cols-[1fr_minmax(320px,420px)]
      "
    >
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
      <CreatePaperForm token={token} exams={exams} />
    </div>
  );
}
