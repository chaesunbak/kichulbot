import { QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';
import { useState } from 'react';

import { createQueryClient } from './query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>{children}</OverlayProvider>
    </QueryClientProvider>
  );
}
