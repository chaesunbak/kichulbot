'use client';

import { Button } from '@kichulbot/ui/components/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { logoutApi } from '@/features/auth/api/client';
import { useAuthStore } from '@/features/auth/store';

export function LogoutButton() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    clearAuth();
    await logoutApi();
    router.push('/');
  };

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      <LogOut />
      로그아웃
    </Button>
  );
}
