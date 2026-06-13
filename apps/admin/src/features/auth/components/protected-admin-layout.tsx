import { ApiError } from '@kichulbot/api-contract';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import { Navigate } from 'react-router';
import { toast } from 'sonner';

import { Layout } from '@/shared/components/layout';

import { meQueryOptions } from '../api/server/queries';
import { useAuthStore } from '../store';

export function ProtectedAdminLayout() {
  const queryClient = useQueryClient();
  const { token, _hasHydrated, clearAuth } = useAuthStore();
  const meQuery = useQuery({
    ...meQueryOptions(token ?? ''),
    enabled: _hasHydrated && !!token,
  });

  React.useEffect(() => {
    if (!meQuery.isError) return;
    if (meQuery.error instanceof ApiError && meQuery.error.status !== 401)
      return;
    clearAuth();
    queryClient.clear();
    toast.error(
      meQuery.error instanceof Error
        ? meQuery.error.message
        : '세션이 만료되었습니다. 다시 로그인해 주세요.',
    );
  }, [clearAuth, meQuery.error, meQuery.isError, queryClient]);

  React.useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      queryClient.clear();
      toast.error('세션이 만료되었습니다. 다시 로그인해 주세요.');
    };
    window.addEventListener('admin:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('admin:unauthorized', handleUnauthorized);
  }, [clearAuth, queryClient]);

  if (!_hasHydrated || (!!token && meQuery.isLoading)) {
    return (
      <main
        className="
          flex min-h-screen items-center justify-center bg-muted/30 px-6
        "
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          관리자 세션 확인 중
        </div>
      </main>
    );
  }
  if (!token || !meQuery.data?.user) return <Navigate to="/login" replace />;
  return <Layout />;
}
