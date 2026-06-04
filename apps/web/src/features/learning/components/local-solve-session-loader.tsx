'use client';

import { Button } from '@kichulbot/ui/components/ui/button';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { SolveSession } from '@/features/learning/components/solve-session';
import {
  getLocalSolveSessionSnapshot,
  parseLocalSolveSessionSnapshot,
} from '@/features/learning/lib/local-solve-session';

export function LocalSolveSessionLoader({ id }: { id: string }) {
  const sessionSnapshot = useSyncExternalStore(
    () => () => {},
    () => getLocalSolveSessionSnapshot(id),
    () => undefined,
  );
  const session = parseLocalSolveSessionSnapshot(sessionSnapshot);

  if (session === undefined) {
    return (
      <div className="grid h-full place-items-center text-sm text-zinc-500">
        풀이를 불러오는 중입니다.
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto grid max-w-md gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-950">
          풀이를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-zinc-500">
          브라우저에 저장된 임시 풀이가 없거나 삭제되었습니다.
        </p>
        <Button asChild>
          <Link href="/resources">자료실로 이동</Link>
        </Button>
      </div>
    );
  }

  return <SolveSession initialSession={session} />;
}
