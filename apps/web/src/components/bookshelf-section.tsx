import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BookshelfSection({
  title,
  countLabel,
  children,
  className,
}: {
  title: ReactNode;
  countLabel?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('mt-5 overflow-hidden rounded-3xl border', className)}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen className="size-4 shrink-0" />
          <h2 className="truncate text-sm font-bold">{title}</h2>
        </div>
        {countLabel ? (
          <p className="shrink-0 text-xs font-medium">{countLabel}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function BookshelfGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-7 px-3 py-6 sm:grid-cols-3 sm:gap-x-5 sm:px-6 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </ul>
  );
}
