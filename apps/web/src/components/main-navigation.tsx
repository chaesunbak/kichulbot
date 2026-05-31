'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  House,
  LibraryBig,
  RotateCcw,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navigationItems: NavigationItem[] = [
  { href: '/home', label: '홈', icon: House },
  { href: '/papers', label: '자료실', icon: BookOpen },
  { href: '/library', label: '내책장', icon: LibraryBig },
  { href: '/recap', label: '복습', icon: RotateCcw },
  { href: '/my', label: '마이페이지', icon: UserRound },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="주 메뉴">
      {navigationItems.map(({ href, label }) => {
        const isActive = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-full px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="주 메뉴"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-zinc-400',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
