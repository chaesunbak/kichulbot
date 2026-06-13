import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kichulbot/ui/components/ui/card';
import { Separator } from '@kichulbot/ui/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@kichulbot/ui/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';

import { useAuthStore } from '@/features/auth/store';
import {
  paperImportJobsQueryOptions,
  papersQueryOptions,
} from '@/features/papers/api/server/queries';
import { CreatePaperForm } from '@/features/papers/components/create-paper-form';
import { ImportPaperForm } from '@/features/papers/components/import-paper-form';
import { PaperImportJobsList } from '@/features/papers/components/paper-import-jobs-list';
import { PapersSummary } from '@/features/papers/components/papers-summary';
import { PapersTable } from '@/features/papers/components/papers-table';
import { examsQueryOptions } from '@/features/reference-data/api/server/queries';

export function PapersPage() {
  const token = useAuthStore((state) => state.token)!;
  const papersQuery = useQuery(papersQueryOptions(token));
  const papers = papersQuery.data?.papers ?? [];
  const importJobsQuery = useQuery(paperImportJobsQueryOptions(token));
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
        </CardHeader>
        <CardContent>
          <PapersSummary papers={papers} />
          <Separator className="mb-4" />
          <PapersTable papers={papers} />
        </CardContent>
      </Card>
      <Tabs defaultValue="pdf" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="manual">수동</TabsTrigger>
        </TabsList>
        <TabsContent value="pdf">
          <div className="space-y-4">
            <ImportPaperForm token={token} exams={exams} />
            <PaperImportJobsList
              jobs={importJobsQuery.data?.jobs ?? []}
              isFetching={importJobsQuery.isFetching}
              onRefresh={() => {
                importJobsQuery.refetch();
                papersQuery.refetch();
              }}
            />
          </div>
        </TabsContent>
        <TabsContent value="manual">
          <CreatePaperForm token={token} exams={exams} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
