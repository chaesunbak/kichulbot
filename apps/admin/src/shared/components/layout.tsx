import { Button } from '@kichulbot/ui/components/button';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { BookOpen, ClipboardList, FolderTree, Tags } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { toast } from 'sonner';

import { LogoutButton } from '@/shared/components/logout-button';
import { cn } from '@/shared/lib/utils';

export const ADMIN_NAV_ITEMS = [
  {
    to: '/exams',
    label: '시험',
    icon: ClipboardList,
  },
  {
    to: '/categories',
    label: '분류',
    icon: FolderTree,
  },
  {
    to: '/tags',
    label: '태그',
    icon: Tags,
  },
  {
    to: '/',
    label: '문제지',
    icon: BookOpen,
  },
] as const;

export function Layout() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="
          mx-auto flex max-w-7xl flex-col gap-4 p-5
          sm:flex-row sm:items-center sm:justify-between
        ">
          <div>
            <h1 className="text-xl font-semibold">기출봇 관리자</h1>
          </div>
          <div className="flex gap-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <Button asChild variant="outline" key={item.to}>
                <Link to={item.to}>
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={isFetching}
              onClick={() => {
                queryClient.invalidateQueries();
                toast.success('관리자 데이터를 불러왔습니다.');
              }}
            >
              <RefreshCw
                className={cn('size-4', isFetching && 'animate-spin')}
              />
              새로고침
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>
      <Outlet />
    </main>
  );
}
