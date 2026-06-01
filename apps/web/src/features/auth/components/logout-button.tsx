'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';
import { useAuthStore } from '@/features/auth/store';

export function LogoutButton() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    clearAuth();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut />
      로그아웃
    </Button>
  );
}
