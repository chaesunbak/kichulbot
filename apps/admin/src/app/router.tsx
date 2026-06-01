import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { ProtectedAdminLayout } from '@/features/auth/components/protected-admin-layout';
import { ErrorBoundary } from './error-boundary';

const LoginPage = lazy(() =>
  import('@/pages/login-page').then((module) => ({
    default: module.LoginPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then((module) => ({
    default: module.NotFoundPage,
  })),
);
const PaperDetailPage = lazy(() =>
  import('@/pages/paper-detail-page').then((module) => ({
    default: module.PaperDetailPage,
  })),
);
const PapersPage = lazy(() =>
  import('@/pages/papers-page').then((module) => ({
    default: module.PapersPage,
  })),
);
const TagsPage = lazy(() =>
  import('@/pages/tags-page').then((module) => ({
    default: module.TagsPage,
  })),
);

function PageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 text-sm text-muted-foreground">
      불러오는 중
    </main>
  );
}

export function AppRouter() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
