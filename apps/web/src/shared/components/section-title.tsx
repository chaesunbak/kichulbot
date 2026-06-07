import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

type SectionTitleProps = ComponentPropsWithoutRef<'h2'>;

export function SectionTitle({ className, ...props }: SectionTitleProps) {
  return (
    <h2
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
}
