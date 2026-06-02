'use client';

import { Button } from '@kichulbot/ui/components/button';
import { Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="
        flex min-h-svh flex-1 items-center justify-center bg-background px-5
        py-16
      "
    >
      <section className="w-full max-w-md text-center">
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          문제가 발생했습니다
        </h1>
        <p className="mt-4 text-sm/6 text-muted-foreground">
          페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        {error.digest ? (
          <p
            className="
              mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground
            "
          >
            오류 코드: {error.digest}
          </p>
        ) : null}
        <div
          className="
            mt-8 flex flex-col justify-center gap-3
            sm:flex-row
          "
        >
          <Button type="button" size="lg" onClick={reset}>
            <RotateCcw className="size-4" />
            다시 시도
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="size-4" />
              홈으로 이동
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
