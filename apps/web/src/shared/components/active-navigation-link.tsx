'use client';

import {
  BookOpen,
  House,
  LibraryBig,
  RotateCcw,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/utils';

export type NavigationIconName =
  | 'book-open'
  | 'house'
  | 'library-big'
  | 'rotate-ccw'
  | 'user-round';

type ActiveNavigationLinkProps = {
  href: string;
  label: string;
  variant: 'desktop' | 'mobile';
  icon?: NavigationIconName;
};

const iconByName = {
  'book-open': BookOpen,
  house: House,
  'library-big': LibraryBig,
  'rotate-ccw': RotateCcw,
  'user-round': UserRound,
} satisfies Record<NavigationIconName, typeof House>;

export function ActiveNavigationLink({
  href,
  icon,
  label,
  variant,
}: ActiveNavigationLinkProps) {
  const pathname = usePathname();
  const isActive = isActivePath(pathname, href);

  if (variant === 'desktop') {
    return (
      <Link
        href={href}
        className={cn(
          'rounded-full px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'text-primary'
            : `
              text-muted-foreground
              hover:text-foreground
            `,
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </Link>
    );
  }

  const Icon = icon ? iconByName[icon] : null;

  return (
    <Link
      href={href}
      className={cn(
        `
          flex min-h-16 flex-col items-center justify-center gap-1 px-1
          text-[11px] font-medium transition-colors
        `,
        isActive ? 'text-primary' : 'text-muted-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {Icon && <Icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />}
      <span>{label}</span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
