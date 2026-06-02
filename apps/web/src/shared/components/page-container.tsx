import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/utils';

type PageContainerProps = ComponentPropsWithoutRef<'div'>;

export function PageContainer({ className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        `
          mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8
          sm:px-6 sm:py-10
        `,
        className,
      )}
      {...props}
    />
  );
}
