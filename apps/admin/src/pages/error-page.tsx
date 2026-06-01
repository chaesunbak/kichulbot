import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@kichulbot/ui/components/button';

interface ErrorPageProps {
  error?: Error;
  onRetry?: () => void;
}

export function ErrorPage({ error, onRetry }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-10">
      <section className="w-full max-w-md rounded-lg border bg-background px-6 py-10 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <p className="mt-7 text-sm font-semibold text-destructive">Error</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          관리자 화면을 불러오지 못했습니다
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          예기치 못한 오류가 발생했습니다. 다시 시도하거나 문제지 관리 화면으로
          이동해 주세요.
        </p>
        {error?.message ? (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
            {error.message}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry ? (
            <Button type="button" onClick={onRetry}>
              <RotateCcw className="size-4" />
              다시 시도
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <a href="/">
              <Home className="size-4" />
              문제지로 이동
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
