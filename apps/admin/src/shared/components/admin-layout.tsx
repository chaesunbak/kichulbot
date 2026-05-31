import { BookOpen, LogOut, RefreshCw, ShieldCheck, Tags } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@kichulbot/ui/components/button';
import { useAuthStore } from '@/features/auth/store';
import { cn } from '@/shared/lib/utils';

export function AdminLayout() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isFetching = useIsFetching() > 0;

  function logout() {
    clearAuth();
    queryClient.clear();
    toast('로그아웃했습니다.');
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h1 className="text-xl font-semibold">기출봇 관리자</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.email ?? user?.nickname ?? '관리자'} 계정으로 접속 중
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">
                <BookOpen className="size-4" />
                문제지
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tags">
                <Tags className="size-4" />
                공식 태그
              </Link>
            </Button>
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
            <Button variant="secondary" onClick={logout}>
              <LogOut className="size-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </main>
  );
}
