import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import { Providers } from './components/providers';
import { AdminDashboard } from './components/admin/admin-dashboard';
import './app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <AdminDashboard />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
