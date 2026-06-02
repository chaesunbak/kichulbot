import { Button } from '@kichulbot/ui/components/button';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/features/auth/store';

export function LogoutButton() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function logout() {
    clearAuth();
    queryClient.clear();
    toast('로그아웃했습니다.');
  }

  return (
    <Button type="button" variant="secondary" onClick={logout}>
      <LogOut className="size-4" />
      로그아웃
    </Button>
  );
}
