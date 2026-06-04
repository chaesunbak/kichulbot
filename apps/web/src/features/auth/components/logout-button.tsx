'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { logoutApi } from '@/features/auth/api/client';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutApi();
    router.push('/');
    router.refresh();
  };

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      <LogOut />
      로그아웃
    </Button>
  );
}
