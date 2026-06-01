import Link from 'next/link';

import { DesktopNavigation } from '@/components/main-navigation';
import type { AuthUser } from '@/lib/auth';

interface Props {
  user: AuthUser;
}

export default function MainHeader({ user }: Props) {
  return (
    <header className="sticky top-0 z-40  bg-white/90 px-4 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6">
        <Link href="/home" className="shrink-0 text-lg font-bold text-zinc-900">
          기출봇
        </Link>
        <DesktopNavigation />
        <Link
          href="/my"
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <span className="hidden lg:inline">
            {user.nickname ?? user.email ?? '게스트'}
          </span>
        </Link>
      </div>
    </header>
  );
}
