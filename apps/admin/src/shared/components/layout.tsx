import { Outlet } from 'react-router';

import { AdminHeader } from '@/shared/components/admin-header';

export function Layout() {
  return (
    <main className="min-h-screen bg-muted/30">
      <AdminHeader />
      <Outlet />
    </main>
  );
}
