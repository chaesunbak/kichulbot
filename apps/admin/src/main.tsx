import './app/globals.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from 'overlay-kit';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { createQueryClient } from './app/query-client';
import { AppRouter } from './app/router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <AppRouter />
      </OverlayProvider>
    </QueryClientProvider>
  );
}
