import { Button } from '@kichulbot/ui/components/ui/button';
import { BookOpen, ClipboardList, FolderTree, Tags } from 'lucide-react';
import { Link } from 'react-router';

import { AdminRefreshButton } from '@/shared/components/admin-refresh-button';
import { LogoutButton } from '@/shared/components/logout-button';

const ADMIN_NAV_ITEMS = [
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

export function AdminHeader() {
  return (
    <header className="border-b bg-background">
      <div
        className="
          mx-auto flex max-w-7xl flex-col gap-4 p-5
          sm:flex-row sm:items-center sm:justify-between
        "
      >
        <h1 className="text-xl font-semibold">기출봇 관리자</h1>
        <div className="flex gap-2">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Button asChild variant="outline" key={item.to}>
              <Link to={item.to}>
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          ))}
          <AdminRefreshButton />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
