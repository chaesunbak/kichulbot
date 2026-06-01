import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { ProtectedAdminLayout } from '@/features/auth/components/protected-admin-layout';
import { LoginPage } from '@/pages/login-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { PaperDetailPage } from '@/pages/paper-detail-page';
import { PapersPage } from '@/pages/papers-page';
import { TagsPage } from '@/pages/tags-page';
import { ErrorBoundary } from './error-boundary';

export function AppRouter() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedAdminLayout />}>
            <Route index element={<PapersPage />} />
            <Route path="/papers/:paperId" element={<PaperDetailPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
