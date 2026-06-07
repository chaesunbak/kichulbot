import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

type PageTitleProps = ComponentPropsWithoutRef<'div'>;

export function PageTitle({ className, ...props }: PageTitleProps) {
  return (
    <div
      className={cn('text-2xl font-semibold text-foreground', className)}
      {...props}
    />
  );
}
