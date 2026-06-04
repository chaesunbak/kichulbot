'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { ResultSession } from '@/features/learning/components/result-session';
import {
  getLocalSolveSessionSnapshot,
  parseLocalSolveSessionSnapshot,
} from '@/features/learning/lib/local-solve-session';

export function LocalResultSessionLoader({ id }: { id: string }) {
  const sessionSnapshot = useSyncExternalStore(
    () => () => {},
    () => getLocalSolveSessionSnapshot(id),
    () => undefined,
  );
  const session = parseLocalSolveSessionSnapshot(sessionSnapshot);

  if (session === undefined) {
    return (
      <div className="grid h-full place-items-center text-sm text-zinc-500">
        결과를 불러오는 중입니다.
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto grid max-w-md gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-950">
          결과를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-zinc-500">
          브라우저에 저장된 임시 결과가 없거나 삭제되었습니다.
        </p>
        <Button asChild>
          <Link href="/resources">자료실로 이동</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div
        className="
          mx-auto mt-4 max-w-6xl rounded-lg border bg-card px-4 py-3 text-sm
          text-zinc-600
        "
      >
        로그인하면 앞으로의 풀이 기록과 오답 복습을 저장할 수 있습니다.
        <Button asChild variant="link" className="ml-2 h-auto p-0">
          <Link href="/login">로그인하기</Link>
        </Button>
      </div>
      <ResultSession session={session} isAuthenticated={false} />
    </div>
  );
}
