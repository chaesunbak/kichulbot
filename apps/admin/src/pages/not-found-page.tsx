import { Home, SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@kichulbot/ui/components/button';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-3xl items-center justify-center px-5 py-12">
      <div className="w-full rounded-lg border bg-background px-6 py-10 text-center shadow-sm sm:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border bg-muted text-muted-foreground">
          <SearchX className="size-7" />
        </div>
        <p className="mt-7 text-sm font-semibold text-primary">404</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          관리자 페이지를 찾을 수 없습니다
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
          요청한 주소가 없거나 이동되었습니다. 문제지 관리 화면으로 돌아가 다시
          확인해 주세요.
        </p>
        <div className="mt-7 flex justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="size-4" />
              문제지로 이동
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
