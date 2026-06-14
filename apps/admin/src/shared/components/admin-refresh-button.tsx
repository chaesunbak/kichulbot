import { Button } from '@kichulbot/ui/components/ui/button';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/shared/lib/utils';

export function AdminRefreshButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isFetching}
      onClick={() => {
        queryClient.invalidateQueries();
        toast.success('관리자 데이터를 불러왔습니다.');
      }}
    >
      <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
      새로고침
    </Button>
  );
}
