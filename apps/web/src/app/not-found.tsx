import { Button } from '@kichulbot/ui/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      className="
        flex min-h-svh flex-1 items-center justify-center bg-background px-5
        py-16
      "
    >
      <section className="w-full max-w-md text-center">
        <p className="mt-8 text-sm font-semibold text-primary">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-4 text-sm/6 text-muted-foreground">
          주소가 바뀌었거나 삭제된 페이지입니다. 홈으로 이동해 다시 시작해
          주세요.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
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
